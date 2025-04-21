import { Express, Request, Response } from 'express';
import { storage } from './storage';
import { UserRole } from './constants/roles';

export function registerRewardsRoutes(app: Express) {
  // Middleware to ensure user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: 'Not authenticated' });
  };
  
  // Middleware to ensure user is a customer (not admin)
  const isCustomer = (req: Request, res: Response, next: Function) => {
    if (req.user && req.user.role === UserRole.CUSTOMER) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Only customers can access rewards.' });
  };

  // Get user rewards information (points, tier, etc.)
  app.get('/api/rewards/points', isAuthenticated, isCustomer, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user reward transactions
      const transactions = await storage.getUserRewards(userId);
      
      // Calculate tier based on points
      const userPoints = user.rewardPoints || 0;
      
      // Tiers configuration
      const tiers = [
        { name: 'silver', threshold: 0, benefits: ['Free cancellation', '5% discount on bookings'] },
        { name: 'gold', threshold: 5000, benefits: ['Free cancellation', '10% discount on bookings', 'Late checkout'] },
        { name: 'platinum', threshold: 15000, benefits: ['Free cancellation', '15% discount on bookings', 'Late checkout', 'Room upgrade'] }
      ];
      
      // Determine current tier
      let currentTier = tiers[0];
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (userPoints >= tiers[i].threshold) {
          currentTier = tiers[i];
          break;
        }
      }
      
      // Determine next tier
      let nextTier = null;
      for (let i = 0; i < tiers.length; i++) {
        if (tiers[i].threshold > userPoints) {
          nextTier = tiers[i];
          break;
        }
      }
      
      // Calculate progress towards next tier
      let progress = 100;
      if (nextTier) {
        const currentThreshold = currentTier.threshold;
        const nextThreshold = nextTier.threshold;
        progress = ((userPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
      }
      
      // Calculate statistics
      const earnedTransactions = transactions.filter(t => t.transactionType === 'earn');
      const redeemedTransactions = transactions.filter(t => t.transactionType === 'redeem');
      
      const totalEarned = earnedTransactions.reduce((sum, t) => sum + t.points, 0);
      const totalRedeemed = redeemedTransactions.reduce((sum, t) => sum + t.points, 0);
      
      const statistics = {
        totalEarned,
        totalRedeemed,
        transactionsCount: transactions.length
      };
      
      return res.json({
        points: userPoints,
        tier: currentTier,
        nextTier,
        progress: Math.min(Math.max(progress, 0), 100), // Ensure progress is between 0-100
        statistics
      });
    } catch (error: any) {
      console.error('Error fetching rewards points:', error);
      res.status(500).json({ message: `Error fetching rewards points: ${error.message}` });
    }
  });
  
  // Get user reward transactions history
  app.get('/api/rewards/transactions', isAuthenticated, isCustomer, async (req, res) => {
    try {
      const userId = req.user!.id;
      let transactions = await storage.getUserRewards(userId);
      
      // Sort transactions by date (newest first)
      transactions = transactions.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      res.json(transactions);
    } catch (error: any) {
      console.error('Error fetching reward transactions:', error);
      res.status(500).json({ message: `Error fetching reward transactions: ${error.message}` });
    }
  });
  
  // Get user's expiring points
  app.get('/api/rewards/expiring', isAuthenticated, isCustomer, async (req, res) => {
    try {
      const userId = req.user!.id;
      const transactions = await storage.getUserRewards(userId);
      
      // Get active transactions with expiry dates
      const expiringTransactions = transactions.filter(
        t => t.status === 'active' && t.expiryDate && t.transactionType === 'earn'
      );
      
      // Sort by expiry date (soonest first)
      expiringTransactions.sort((a, b) => {
        if (!a.expiryDate || !b.expiryDate) return 0;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
      
      // Calculate total expiring points
      const totalExpiring = expiringTransactions.reduce((sum, t) => sum + t.points, 0);
      
      // Get nearest expiry date if any
      let nearestExpiry = null;
      if (expiringTransactions.length > 0 && expiringTransactions[0].expiryDate) {
        nearestExpiry = expiringTransactions[0].expiryDate;
      }
      
      res.json({
        expiringTransactions,
        totalExpiring,
        nearestExpiry
      });
    } catch (error: any) {
      console.error('Error fetching expiring points:', error);
      res.status(500).json({ message: `Error fetching expiring points: ${error.message}` });
    }
  });
  
  // Redeem points for a discount
  app.post('/api/rewards/redeem', isAuthenticated, isCustomer, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { points, description } = req.body;
      
      if (!points || !description) {
        return res.status(400).json({ message: 'Points and description are required' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if ((user.rewardPoints || 0) < points) {
        return res.status(400).json({ message: 'Not enough points' });
      }
      
      // Create redemption transaction
      const transaction = await storage.createRewardTransaction({
        userId,
        points,
        description,
        transactionType: 'redeem',
        status: 'active'
      });
      
      // Update user's points balance
      const newBalance = (user.rewardPoints || 0) - points;
      await storage.updateUser(userId, { rewardPoints: newBalance });
      
      res.json({
        transaction,
        newBalance
      });
    } catch (error: any) {
      console.error('Error redeeming points:', error);
      res.status(500).json({ message: `Error redeeming points: ${error.message}` });
    }
  });
  
  // Transfer points to another user
  app.post('/api/rewards/transfer', isAuthenticated, isCustomer, async (req, res) => {
    try {
      const senderId = req.user!.id;
      const { points, recipientEmail, description } = req.body;
      
      if (!points || !recipientEmail || !description) {
        return res.status(400).json({ message: 'Points, recipient email and description are required' });
      }
      
      const sender = await storage.getUser(senderId);
      
      if (!sender) {
        return res.status(404).json({ message: 'Sender not found' });
      }
      
      if ((sender.rewardPoints || 0) < points) {
        return res.status(400).json({ message: 'Not enough points' });
      }
      
      // Find recipient by email
      const recipient = await storage.getUserByEmail(recipientEmail);
      
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      
      // Create transfer transaction for sender
      const senderTransaction = await storage.createRewardTransaction({
        userId: senderId,
        points,
        description: `Transfer to ${recipientEmail}: ${description}`,
        transactionType: 'transfer',
        status: 'active',
        recipientId: recipient.id
      });
      
      // Create earn transaction for recipient
      const recipientTransaction = await storage.createRewardTransaction({
        userId: recipient.id,
        points,
        description: `Received from ${sender.email || sender.username}: ${description}`,
        transactionType: 'earn',
        status: 'active',
        recipientId: senderId,
        // Set expiry date for earned points (1 year)
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      
      // Update balances
      const senderNewBalance = (sender.rewardPoints || 0) - points;
      const recipientNewBalance = (recipient.rewardPoints || 0) + points;
      
      await storage.updateUser(senderId, { rewardPoints: senderNewBalance });
      await storage.updateUser(recipient.id, { rewardPoints: recipientNewBalance });
      
      res.json({
        senderTransaction,
        recipientTransaction,
        newBalance: senderNewBalance
      });
    } catch (error: any) {
      console.error('Error transferring points:', error);
      res.status(500).json({ message: `Error transferring points: ${error.message}` });
    }
  });
}
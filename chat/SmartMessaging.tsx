
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Message } from 'lucide-react';

export function SmartMessaging() {
  const [messages, setMessages] = useState<{
    id: string;
    text: string;
    sender: 'guest' | 'host';
    timestamp: Date;
  }[]>([]);

  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setMessages([...messages, {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'host',
      timestamp: new Date()
    }]);
    setNewMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Communications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'host' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] p-3 rounded-lg ${
                message.sender === 'host' ? 'bg-primary text-white' : 'bg-gray-100'
              }`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}

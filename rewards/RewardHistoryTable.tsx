import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useChillPoints } from './ChillPointsProvider';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { ArrowUp, ArrowDown, SearchIcon, FilterIcon } from 'lucide-react';

// نوع بيانات حالة الترشيح
interface FilterState {
  type: string;
  search: string;
}

export const RewardHistoryTable: React.FC = () => {
  const { transactions, transactionsLoading } = useChillPoints();
  const { t, locale } = useTranslation();
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    search: '',
  });

  // دالة تنسيق التاريخ حسب اللغة
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'PPP', {
        locale: locale === 'ar' ? arSA : undefined,
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // تحديد لون العملية حسب نوعها
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
      case 'redeem':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'transfer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'expire':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // تحديد اسم نوع العملية حسب اللغة
  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'earn':
        return t('rewards.transactionTypes.earn');
      case 'redeem':
        return t('rewards.transactionTypes.redeem');
      case 'transfer':
        return t('rewards.transactionTypes.transfer');
      case 'expire':
        return t('rewards.transactionTypes.expire');
      default:
        return type;
    }
  };

  // تنقية المعاملات حسب المرشح الحالي
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((transaction) => {
      // تصفية حسب النوع
      if (filters.type !== 'all' && transaction.transactionType !== filters.type) {
        return false;
      }

      // تصفية حسب البحث
      if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // واجهة التحميل
  if (transactionsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="border rounded-md">
          <div className="p-4">
            <Skeleton className="h-6 w-full mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full my-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // عرض عند عدم وجود معاملات
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">{t('rewards.noTransactionsFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* أدوات الترشيح */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters({ ...filters, type: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('rewards.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('rewards.allTransactions')}</SelectItem>
              <SelectItem value="earn">{t('rewards.transactionTypes.earn')}</SelectItem>
              <SelectItem value="redeem">{t('rewards.transactionTypes.redeem')}</SelectItem>
              <SelectItem value="transfer">{t('rewards.transactionTypes.transfer')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <SearchIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
          <Input
            placeholder={t('rewards.searchTransactions')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      {/* جدول المعاملات */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('rewards.date')}</TableHead>
              <TableHead>{t('rewards.type')}</TableHead>
              <TableHead>{t('rewards.description')}</TableHead>
              <TableHead className="text-right">{t('rewards.points')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(transaction.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getTransactionTypeColor(transaction.transactionType)} border-0`}
                  >
                    {getTransactionTypeName(transaction.transactionType)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[280px] truncate">
                  {transaction.description}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-medium">
                  <span className="flex items-center justify-end gap-1">
                    {transaction.transactionType === 'earn' || transaction.transactionType === 'transfer' ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">+{transaction.points}</span>
                      </>
                    ) : transaction.transactionType === 'redeem' || transaction.transactionType === 'expire' ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">-{transaction.points}</span>
                      </>
                    ) : (
                      transaction.points
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* في حالة عدم وجود نتائج مرشحة */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('rewards.noFilteredResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  disabled?: boolean;
}

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
}: DateRangePickerProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<"start" | "end">("start");

  // Ensure dates are valid
  useEffect(() => {
    if (!isValid(startDate)) {
      onStartDateChange(new Date());
    }
    if (!isValid(endDate)) {
      onEndDateChange(new Date());
    }
  }, [startDate, endDate, onStartDateChange, onEndDateChange]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (selectedRange === "start") {
      onStartDateChange(date);
      setSelectedRange("end");
      
      // If the new start date is after or same as current end date,
      // set the end date to be day after start date
      if (date >= endDate) {
        const newEndDate = new Date(date);
        newEndDate.setDate(newEndDate.getDate() + 1);
        onEndDateChange(newEndDate);
      }
    } else {
      // Make sure end date is not before start date
      if (date <= startDate) {
        const newEndDate = new Date(startDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        onEndDateChange(newEndDate);
      } else {
        onEndDateChange(date);
      }
      setIsCalendarOpen(false);
      setSelectedRange("start");
    }
  };

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <div className="grid grid-cols-2 divide-x cursor-pointer">
          <div 
            className={`px-4 py-3 ${selectedRange === "start" ? "bg-gray-50" : ""}`}
            onClick={() => {
              if (!disabled) {
                setSelectedRange("start");
                setIsCalendarOpen(true);
              }
            }}
          >
            <p className="text-xs font-medium text-dark-gray">CHECK-IN</p>
            <p className="text-dark-gray">{format(startDate, "MMM d, yyyy")}</p>
          </div>
          <div 
            className={`px-4 py-3 ${selectedRange === "end" ? "bg-gray-50" : ""}`}
            onClick={() => {
              if (!disabled) {
                setSelectedRange("end");
                setIsCalendarOpen(true);
              }
            }}
          >
            <p className="text-xs font-medium text-dark-gray">CHECKOUT</p>
            <p className="text-dark-gray">{format(endDate, "MMM d, yyyy")}</p>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <Calendar
          mode="single"
          selected={selectedRange === "start" ? startDate : endDate}
          onSelect={handleDateSelect}
          initialFocus
          disabled={[
            { before: new Date() },
            ...(selectedRange === "end" ? [{ before: startDate }] : [])
          ]}
        />
        <div className="flex items-center justify-between p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCalendarOpen(false);
              setSelectedRange("start");
            }}
          >
            Cancel
          </Button>
          {selectedRange === "end" && (
            <Button
              size="sm"
              onClick={() => {
                setIsCalendarOpen(false);
                setSelectedRange("start");
              }}
            >
              Apply
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;

import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface StreakDisplayProps {
  onClose: () => void;
}

// Define types for calendar
type Level = 0 | 1 | 2 | 3 | 4;

// Define interface for tooltip data
interface TooltipData {
  date: string;
  count: number;
  x: number;
  y: number;
}

export default function StreakDisplay({ onClose }: StreakDisplayProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sessionData, setSessionData] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [nextMilestone, setNextMilestone] = useState(10);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Days of the week
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Format month name for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Check if a date is today
  const isToday = (date: string) => {
    // Get today's date in the user's local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${year}-${month}-${day}`;
    
    // Direct string comparison for exact match
    return date === todayFormatted;
  };

  useEffect(() => {
    // Log today's date for debugging purposes
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${year}-${month}-${day}`;
    console.log('Today is (local time):', todayFormatted);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Get all day records first
        const daysRef = collection(db, `users/${user.uid}/days`);
        const querySnapshot = await getDocs(daysRef);
        
        const data: { [key: string]: number } = {};
        querySnapshot.forEach((doc) => {
          data[doc.id] = doc.data().count || 0;
        });
        
        setSessionData(data);
        
        // Get user document for streak info
        const userDoc = await getDoc(doc(db, `users/${user.uid}`));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentStreak(userData.currentStreak || 0);
          setLongestStreak(userData.longestStreak || 0);
          
          // Calculate next milestone based on total session days
          const totalSessionDays = Object.keys(data).filter(d => data[d] > 0).length;
          setNextMilestone(Math.ceil((totalSessionDays + 1) / 10) * 10);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Handle mouse over for tooltip
  const handleDayMouseOver = (date: string, count: number, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    setTooltip({
      date,
      count,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY
    });
  };

  // Handle mouse leave for tooltip
  const handleDayMouseLeave = () => {
    setTooltip(null);
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar data
  const generateCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const sessionCount = sessionData[date] || 0;
      
      days.push({
        day,
        date,
        isCurrentMonth: true,
        hasSession: sessionCount > 0,
        sessionCount,
        level: getActivityLevel(sessionCount)
      });
    }
    
    return days;
  };

  // Get activity level based on session count
  const getActivityLevel = (count: number): Level => {
    if (count === 0) return 0;
    return Math.min(Math.ceil(count / 2), 4) as Level;
  };

  // Determine if a day is the next milestone day
  const isMilestoneDay = (date: string) => {
    if (!user || currentStreak === 0) return false;
    
    // Convert the current date string to a Date object
    const checkDate = new Date(date);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate days remaining to reach the milestone (subtract 1 to get the exact day)
    const daysRemaining = (nextMilestone - currentStreak);
    
    // If we've already reached the milestone, there's no next milestone day
    if (daysRemaining <= 0) return false;
    
    // Calculate the future date when we'll reach the milestone
    const milestoneDate = new Date(today);
    milestoneDate.setDate(today.getDate() + daysRemaining - 1); // Subtract 1 to get the correct day
    
    // Check if this date is the milestone date
    return checkDate.getFullYear() === milestoneDate.getFullYear() &&
           checkDate.getMonth() === milestoneDate.getMonth() &&
           checkDate.getDate() === milestoneDate.getDate();
  };

  // Get color for activity level
  const getColorForLevel = (level: Level) => {
    const colors = ['#eee', '#FEF3C7', '#FDE68A', '#F59E0B', '#D97706'];
    return colors[level];
  };

  // Render calendar
  const renderCalendar = () => {
    const calendarDays = generateCalendarData();
    
    return (
      <div className="calendar-container">
        {/* Month navigation */}
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-amber-100 text-amber-700"
            aria-label="Previous month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h3 className="text-lg font-medium text-[#422006]">
            {formatMonthYear(currentMonth)}
          </h3>
          <button 
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-amber-100 text-amber-700"
            aria-label="Next month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-gray-400 text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`
                aspect-square relative flex items-center justify-center text-sm 
                ${!day.isCurrentMonth ? 'invisible' : ''}
              `}
            >
              {day.isCurrentMonth && (
                <div
                  className={`
                    w-full h-full flex items-center justify-center rounded-md
                    relative
                    ${day.hasSession ? '' : 'text-gray-400'}
                    ${isMilestoneDay(day.date || '') ? 'border-2 border-dashed border-amber-400' : ''}
                  `}
                  style={{
                    backgroundColor: day.hasSession
                      ? getColorForLevel(day.level as Level)
                      : 'transparent'
                  }}
                  onMouseOver={(e) => day.hasSession && day.date && handleDayMouseOver(day.date, day.sessionCount, e)}
                  onMouseLeave={handleDayMouseLeave}
                >
                  {day.date && isToday(day.date) ? (
                    <div 
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center
                        ${day.hasSession ? 'border-2 border-amber-700' : 'bg-amber-500'}
                      `}
                      style={{
                        backgroundColor: day.hasSession
                          ? getColorForLevel(day.level as Level)
                          : undefined
                      }}
                    >
                      <span className={`font-medium ${day.hasSession ? 'text-amber-900' : 'text-white'}`}>
                        {day.day}
                      </span>
                    </div>
                  ) : (
                    isMilestoneDay(day.date || '') ? (
                      <span 
                        className="font-medium text-amber-700 cursor-help" 
                        title={`${t('home.nextMilestone')}: ${nextMilestone} ${t('home.days')}`}
                      >
                        {day.day}
                      </span>
                    ) : (
                      day.day
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Color legend */}
        <div className="mt-6 flex items-center justify-end text-xs text-[#422006]">
          <div className="flex items-center gap-1">
            <span>{t('home.less')}</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div 
                key={level} 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getColorForLevel(level as Level) }}
              ></div>
            ))}
            <span>{t('home.more')}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-[#422006]">{t('home.learningHistory')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-amber-200 flex items-center justify-center bg-amber-50/80 hover:bg-amber-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Streak summary */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="bg-amber-50 rounded-lg p-4 flex-1 min-w-[120px]">
            <p className="text-[#422006]/70 text-sm">{t('home.currentStreak')}</p>
            <p className="text-2xl font-bold text-[#422006]">{currentStreak} {t('home.days')}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 flex-1 min-w-[120px]">
            <p className="text-[#422006]/70 text-sm">{t('home.longestStreakTitle')}</p>
            <p className="text-2xl font-bold text-[#422006]">{longestStreak} {t('home.days')}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 flex-1 min-w-[120px]">
            <p className="text-[#422006]/70 text-sm">{t('home.nextMilestone')}</p>
            <p className="text-2xl font-bold text-[#422006]">{nextMilestone} {t('home.days')}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-[#422006]/60">{t('home.loadingHistory')}</p>
          </div>
        ) : (
          <div className="relative">
            {renderCalendar()}
            
            {/* Tooltip */}
            {tooltip && (
              <div 
                ref={tooltipRef}
                className="absolute bg-white p-2 rounded shadow-lg border border-amber-200 z-50 text-sm"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y + 5}px`
                }}
              >
                <div className="font-medium">{new Date(tooltip.date).toLocaleDateString()}</div>
                <div>
                  {tooltip.count} {tooltip.count === 1 ? t('home.session') : t('home.sessions', { count: tooltip.count, plural: 's' })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {!loading && Object.keys(sessionData).length === 0 && (
          <p className="text-center py-8 text-[#422006]/60">{t('home.noSessions')}</p>
        )}
      </div>
    </div>
  );
} 
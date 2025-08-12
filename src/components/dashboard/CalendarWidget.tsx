'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  MapPin,
  User
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'deadline' | 'reminder';
  client?: string;
  location?: string;
}

interface CalendarWidgetProps {
  events: CalendarEvent[];
  maxEvents?: number;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  events, 
  maxEvents = 5 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deadline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxEvents);
  
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-8"></div>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getDate() === day && 
                     today.getMonth() === currentMonth && 
                     today.getFullYear() === currentYear;
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day &&
               eventDate.getMonth() === currentMonth &&
               eventDate.getFullYear() === currentYear;
      });
      
      days.push(
        <div
          key={day}
          className={`h-8 w-8 flex items-center justify-center text-sm relative cursor-pointer hover:bg-gray-100 rounded ${
            isToday ? 'bg-blue-600 text-white font-semibold' : 'text-gray-700'
          }`}
        >
          {day}
          {dayEvents.length > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Planning</h3>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
      
      {/* Mini calendrier */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700">
            {monthNames[currentMonth]} {currentYear}
          </h4>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="h-6 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>
      
      {/* Événements à venir */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Prochains événements
        </h4>
        
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-4">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun événement prévu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${getEventTypeColor(event.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium">{event.title}</h5>
                    <div className="flex items-center space-x-4 mt-1 text-xs">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}</span>
                      </div>
                      {event.client && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{event.client}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
          Voir le planning complet
        </button>
      </div>
    </div>
  );
};

export default CalendarWidget;
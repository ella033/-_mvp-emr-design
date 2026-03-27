import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SelectedDateState {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const useSelectedDateStore = create<SelectedDateState>()(
  devtools(
    (set) => ({
      selectedDate: new Date(),
      setSelectedDate: (date: Date) => {
        set({ selectedDate: date });
      },
    }),
    {
      name: 'selected-date-store',
    }
  )
);

// Selectors
export const useSelectedDate = () => useSelectedDateStore((state) => state.selectedDate);
export const useSetSelectedDate = () => useSelectedDateStore((state) => state.setSelectedDate);

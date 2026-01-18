import localforage from 'localforage';

localforage.config({
  name: 'TraderTimeOrganizer',
  storeName: 'trader_time_data',
  description: 'Local storage for Trader Time Organizer PWA'
});

export { localforage };

/**
 * lang.js — Standalone language/i18n module
 * Exports translations and helpers used across pages
 */

window.LANG = {
  en: {
    appName: "Telegram Food Order",
    // Categories
    catAll: "All", catMain: "🍛 Main", catNoodle: "🍜 Noodle",
    catDessert: "🍮 Dessert", catDrink: "🥤 Drink", catAppetizer: "🥗 Appetizer",
    // Status
    statusPending: "⏳ Pending",
    statusAccepted: "✅ Accepted",
    statusRejected: "❌ Rejected",
    statusDelivered: "🚀 Delivered",
  },
  km: {
    appName: "ការបញ្ជាទិញអាហារ Telegram",
    catAll: "ទាំងអស់", catMain: "🍛 មុខម្ហូបចម្បង", catNoodle: "🍜 មីស",
    catDessert: "🍮 បង្អែម", catDrink: "🥤 ភេសជ្ជៈ", catAppetizer: "🥗 ចានដំបូង",
    statusPending: "⏳ កំពុងរង់ចាំ",
    statusAccepted: "✅ ទទួលយកបានហើយ",
    statusRejected: "❌ បដិសេធ",
    statusDelivered: "🚀 ដឹកជញ្ជូន",
  }
};

window.getLang = function() {
  return localStorage.getItem('lang') || 'en';
};

window.tr = function(key) {
  const l = window.getLang();
  return (window.LANG[l] && window.LANG[l][key]) || (window.LANG.en[key]) || key;
};

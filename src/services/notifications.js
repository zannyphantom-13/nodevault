// NodeVault Protocol — Notification & Onboarding Email Engine
// Handles persistent in-app notifications and simulated welcome onboarding emails.

const NOTIF_STORAGE_KEY = 'nodevault_notifications';

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredNotifications(notifs) {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs));
  } catch (err) {
    console.error('Failed to store notifications:', err);
  }
}

export const notificationService = {
  // Get all notifications for a specific user
  getUserNotifications(userId) {
    const all = getStoredNotifications();
    return all.filter(n => n.userId === userId || n.userId === 'all');
  },

  // Get unread notification count
  getUnreadCount(userId) {
    const userNotifs = this.getUserNotifications(userId);
    return userNotifs.filter(n => !n.read).length;
  },

  // Push new notification
  pushNotification(userId, { title, message, type = 'info', actionUrl = null, emailData = null }) {
    const notifs = getStoredNotifications();
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId,
      title,
      message,
      type, // 'welcome' | 'kyc' | 'bank' | 'stake' | 'withdrawal' | 'alert'
      actionUrl,
      emailData, // if present, contains email subject, template, and timestamp
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifs.unshift(newNotif);
    setStoredNotifications(notifs);
    return newNotif;
  },

  // Mark single notification as read
  markAsRead(notificationId) {
    const notifs = getStoredNotifications();
    const target = notifs.find(n => n.id === notificationId);
    if (target) {
      target.read = true;
      setStoredNotifications(notifs);
    }
  },

  // Mark all notifications for a user as read
  markAllAsRead(userId) {
    const notifs = getStoredNotifications();
    notifs.forEach(n => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
      }
    });
    setStoredNotifications(notifs);
  },

  // Trigger Full New-User Onboarding Sequence (Welcome Email + Checklist Notifications)
  triggerNewUserOnboarding(user) {
    const userId = user.id;

    // 1. Welcome Email & Notification
    this.pushNotification(userId, {
      title: '🎉 Welcome to NodeVault Protocol!',
      message: `Your account has been initialized (${user.email}). Welcome to institutional-grade yield staking.`,
      type: 'welcome',
      actionUrl: '/dashboard',
      emailData: {
        to: user.email,
        from: 'compliance@nodevault.io',
        subject: 'Welcome to NodeVault Protocol — Validator Account Initialized',
        name: user.name || 'Node Operator',
        referralCode: user.referralCode,
        joinDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        content: `Thank you for establishing your decentralized validator account on NodeVault.
        
To activate node staking and receive monthly yield dividends, please complete the two mandatory security steps:
1. Submit your NUBAN bank account so our treasury system knows where your payouts are dispatched.
2. Complete your Tier-1 KYC verification for anti-money laundering (AML) regulatory clearance.

Once verified, your account is immediately approved for staking across all active Genesis Node pools.`
      }
    });

    // 2. Bank Account Requirement Notice
    this.pushNotification(userId, {
      title: '🏦 Payout Account Required',
      message: 'You are required to submit your bank account details so the protocol can determine where yield and refunds are paid.',
      type: 'bank',
      actionUrl: '/account',
    });

    // 3. KYC Requirement Notice
    this.pushNotification(userId, {
      title: '🪪 Identity Verification (KYC) Required',
      message: 'KYC verification must be completed before you are permitted to stake on a node or request withdrawals.',
      type: 'kyc',
      actionUrl: '/kyc',
    });
  }
};

/**
 * voiceCommandConfig.js
 *
 * Central config for voice navigation + action commands.
 * Supports: English · Hinglish (Roman Hindi) · Hindi (Devanagari)
 *
 * Pattern types handled by the parser:
 *   English prefix  : "open dashboard"         → trigger + destination
 *   Hindi suffix    : "dashboard kholo"         → destination + trigger
 *   Direct keyword  : "dashboard" / "डैशबोर्ड" → just the keyword
 */

export const VOICE_COMMANDS = {

    // ─────────────────────────────────────────────────────────────────────────
    // NAVIGATION — keyword → route
    // Every key is lowercase. Add as many aliases as needed.
    // ─────────────────────────────────────────────────────────────────────────
    navigation: {

        // ── Dashboard ────────────────────────────────────────────────────────
        'dashboard'                         : '/live-m2m',
        'live m2m'                          : '/live-m2m',
        'home'                              : '/live-m2m',
        'main dashboard'                    : '/live-m2m',
        // Hindi / Hinglish
        'डैशबोर्ड'                           : '/live-m2m',
        'होम'                               : '/live-m2m',
        'मुख्य पेज'                          : '/live-m2m',
        'main page'                         : '/live-m2m',

        // ── Kite Dashboard ───────────────────────────────────────────────────
        'kite dashboard'                    : '/kite-dashboard',
        'kite'                              : '/kite-dashboard',
        // Hindi
        'kite डैशबोर्ड'                      : '/kite-dashboard',
        'काइट'                              : '/kite-dashboard',
        'काइट डैशबोर्ड'                      : '/kite-dashboard',

        // ── Voice Modulation ─────────────────────────────────────────────────
        'voice modulation'                  : '/voice-modulation',
        'voice'                             : '/voice-modulation',
        // Hindi
        'वॉइस'                              : '/voice-modulation',
        'वॉइस मोड्यूलेशन'                    : '/voice-modulation',
        'आवाज़'                             : '/voice-modulation',

        // ── Market Watch ─────────────────────────────────────────────────────
        'market watch'                      : '/market-watch',
        'market'                            : '/market-watch',
        // Hindi
        'मार्केट वॉच'                         : '/market-watch',
        'मार्केट'                            : '/market-watch',
        'बाज़ार'                             : '/market-watch',

        // ── Notifications ────────────────────────────────────────────────────
        'notifications'                     : '/notifications',
        'notification'                      : '/notifications',
        'sent message'                      : '/user-notifications',
        'user notifications'                : '/user-notifications',
        // Hindi
        'नोटिफिकेशन'                         : '/notifications',
        'सूचनाएं'                            : '/notifications',
        'भेजा संदेश'                         : '/user-notifications',

        // ── Action Ledger ────────────────────────────────────────────────────
        'action ledger'                     : '/action-ledger',
        'ledger'                            : '/action-ledger',
        // Hindi
        'एक्शन लेजर'                         : '/action-ledger',
        'लेजर'                              : '/action-ledger',

        // ── Positions ────────────────────────────────────────────────────────
        'active positions'                  : '/active-positions',
        'closed positions'                  : '/closed-positions',
        // Hindi
        'एक्टिव पोजीशन'                      : '/active-positions',
        'एक्टिव पोजीशन्स'                     : '/active-positions',
        'क्लोज्ड पोजीशन'                     : '/closed-positions',
        'क्लोज्ड पोजीशन्स'                    : '/closed-positions',
        'खुली पोजीशन'                        : '/active-positions',
        'बंद पोजीशन'                         : '/closed-positions',

        // ── Trading Clients ──────────────────────────────────────────────────
        'trading clients'                   : '/trading-clients',
        'trading client'                    : '/trading-clients',
        'clients'                           : '/trading-clients',
        // Hindi
        'ट्रेडिंग क्लाइंट्स'                   : '/trading-clients',
        'ट्रेडिंग क्लाइंट'                     : '/trading-clients',
        'क्लाइंट'                            : '/trading-clients',
        'क्लाइंट्स'                           : '/trading-clients',
        'ग्राहक'                             : '/trading-clients',

        // ── Trades ───────────────────────────────────────────────────────────
        'trades'                            : '/trades',
        'group trades'                      : '/group-trades',
        'closed trades'                     : '/closed-trades',
        'deleted trades'                    : '/deleted-trades',
        // Hindi
        'ट्रेड्स'                             : '/trades',
        'ट्रेड'                              : '/trades',
        'ग्रुप ट्रेड्स'                       : '/group-trades',
        'ग्रुप ट्रेड'                         : '/group-trades',
        'क्लोज्ड ट्रेड्स'                     : '/closed-trades',
        'डिलीटेड ट्रेड्स'                      : '/deleted-trades',

        // ── Pending Orders ───────────────────────────────────────────────────
        'pending orders'                    : '/pending-orders',
        'orders'                            : '/pending-orders',
        // Hindi
        'पेंडिंग ऑर्डर'                       : '/pending-orders',
        'पेंडिंग ऑर्डर्स'                      : '/pending-orders',
        'बकाया ऑर्डर'                        : '/pending-orders',

        // ── Trader Funds ─────────────────────────────────────────────────────
        'trader funds'                      : '/funds',
        'funds'                             : '/funds',
        // Hindi
        'ट्रेडर फंड्स'                        : '/funds',
        'फंड्स'                             : '/funds',
        'फंड'                               : '/funds',
        'पैसे'                              : '/funds',

        // ── Brokers ──────────────────────────────────────────────────────────
        'brokers'                           : '/brokers',
        'broker'                            : '/brokers',
        // Hindi
        'ब्रोकर्स'                            : '/brokers',
        'ब्रोकर'                             : '/brokers',

        // ── Admins ───────────────────────────────────────────────────────────
        'admins'                            : '/admins',
        'admin'                             : '/admins',
        // Hindi
        'एडमिन'                             : '/admins',
        'एडमिन्स'                            : '/admins',
        'प्रशासक'                            : '/admins',

        // ── Tickers ──────────────────────────────────────────────────────────
        'tickers'                           : '/tickers',
        'ticker'                            : '/tickers',
        // Hindi
        'टिकर्स'                             : '/tickers',
        'टिकर'                              : '/tickers',

        // ── Banned Limit Orders ──────────────────────────────────────────────
        'banned limit orders'               : '/banned',
        'banned orders'                     : '/banned',
        'banned'                            : '/banned',
        // Hindi
        'बैन्ड ऑर्डर'                        : '/banned',
        'बैन्ड लिमिट ऑर्डर'                   : '/banned',

        // ── Bank Details ─────────────────────────────────────────────────────
        'bank details'                      : '/bank',
        'bank'                              : '/bank',
        'bank details for new'              : '/new-client-bank',
        'new client bank'                   : '/new-client-bank',
        // Hindi
        'बैंक'                              : '/bank',
        'बैंक डिटेल्स'                        : '/bank',
        'नए क्लाइंट बैंक'                    : '/new-client-bank',

        // ── Accounts ─────────────────────────────────────────────────────────
        'accounts'                          : '/accounts',
        'broker accounts'                   : '/broker-accounts',
        // Hindi
        'अकाउंट'                             : '/accounts',
        'अकाउंट्स'                            : '/accounts',
        'ब्रोकर अकाउंट'                       : '/broker-accounts',
        'ब्रोकर अकाउंट्स'                      : '/broker-accounts',

        // ── IP / Logs ────────────────────────────────────────────────────────
        'ip logins'                         : '/ip-logins',
        'ip login'                          : '/ip-logins',
        'trade ip tracking'                 : '/trade-ip-tracking',
        'ip tracking'                       : '/trade-ip-tracking',
        // Hindi
        'आईपी लॉगिन'                         : '/ip-logins',
        'आईपी ट्रैकिंग'                       : '/trade-ip-tracking',

        // ── Settings ─────────────────────────────────────────────────────────
        'global updation'                   : '/global-updation',
        'global update'                     : '/global-updation',
        'expiry rules'                      : '/expiry-rules',
        'expiry'                            : '/expiry-rules',
        'change login password'             : '/change-password',
        'change password'                   : '/change-password',
        'change transaction password'       : '/change-transaction-password',
        // Hindi
        'ग्लोबल अपडेशन'                       : '/global-updation',
        'एक्सपायरी रूल्स'                      : '/expiry-rules',
        'पासवर्ड बदलो'                        : '/change-password',
        'लॉगिन पासवर्ड'                       : '/change-password',
        'ट्रांज़ेक्शन पासवर्ड'                  : '/change-transaction-password',

        // ── Requests ─────────────────────────────────────────────────────────
        'withdrawal requests'               : '/withdrawal-requests',
        'withdrawals'                       : '/withdrawal-requests',
        'withdrawal'                        : '/withdrawal-requests',
        'deposit requests'                  : '/deposit-requests',
        'deposits'                          : '/deposit-requests',
        'deposit'                           : '/deposit-requests',
        // Hindi
        'विदड्रॉल'                           : '/withdrawal-requests',
        'विदड्रॉल रिक्वेस्ट'                   : '/withdrawal-requests',
        'निकासी'                             : '/withdrawal-requests',
        'निकासी अनुरोध'                       : '/withdrawal-requests',
        'डिपॉज़िट'                           : '/deposit-requests',
        'डिपॉज़िट रिक्वेस्ट'                   : '/deposit-requests',
        'जमा'                               : '/deposit-requests',
        'जमा अनुरोध'                         : '/deposit-requests',

        // ── Negative Balance ─────────────────────────────────────────────────
        'negative balance'                  : '/negative-balance',
        // Hindi
        'नेगेटिव बैलेंस'                       : '/negative-balance',
        'ऋणात्मक बैलेंस'                       : '/negative-balance',

        // ── Support / Ticket ─────────────────────────────────────────────────
        'raise ticket'                      : '/support',
        'support'                           : '/support',
        'ticket'                            : '/support',
        // Hindi
        'टिकट'                              : '/support',
        'सपोर्ट'                             : '/support',
        'शिकायत'                             : '/support',

        // ── Voice History ────────────────────────────────────────────────────
        'voice history'                     : '/voice-history',
        'voice recordings'                  : '/voice-history',
        'recordings'                        : '/voice-history',
        // Hindi
        'वॉइस हिस्ट्री'                        : '/voice-history',
        'रिकॉर्डिंग्स'                          : '/voice-history',
        'रिकॉर्डिंग'                           : '/voice-history',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ACTIONS — keyword → { action, route, label }
    // Matched when user uses an action trigger (add/create/banao/jodo etc.)
    // ─────────────────────────────────────────────────────────────────────────
    actions: {
        // English
        'trading client'    : { action: 'OPEN_TRADING_CLIENT_FORM', route: '/trading-clients/create', label: 'Trading Client' },
        'client'            : { action: 'OPEN_TRADING_CLIENT_FORM', route: '/trading-clients/create', label: 'Trading Client' },
        'broker'            : { action: 'OPEN_BROKER_FORM',         route: '/brokers/create',          label: 'Broker'         },
        'admin'             : { action: 'OPEN_ADMIN_FORM',          route: '/admins/create',            label: 'Admin'          },
        'trade'             : { action: 'OPEN_TRADE_FORM',          route: '/trades/create',            label: 'Trade'          },
        'fund'              : { action: 'OPEN_FUND_FORM',           route: '/funds/create',             label: 'Fund Entry'     },

        // Hindi / Devanagari
        'ट्रेडिंग क्लाइंट'   : { action: 'OPEN_TRADING_CLIENT_FORM', route: '/trading-clients/create', label: 'Trading Client' },
        'क्लाइंट'            : { action: 'OPEN_TRADING_CLIENT_FORM', route: '/trading-clients/create', label: 'Trading Client' },
        'ग्राहक'             : { action: 'OPEN_TRADING_CLIENT_FORM', route: '/trading-clients/create', label: 'Trading Client' },
        'ब्रोकर'             : { action: 'OPEN_BROKER_FORM',         route: '/brokers/create',          label: 'Broker'         },
        'एडमिन'             : { action: 'OPEN_ADMIN_FORM',          route: '/admins/create',            label: 'Admin'          },
        'ट्रेड'              : { action: 'OPEN_TRADE_FORM',          route: '/trades/create',            label: 'Trade'          },
        'फंड'               : { action: 'OPEN_FUND_FORM',           route: '/funds/create',             label: 'Fund Entry'     },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGERS
// ─────────────────────────────────────────────────────────────────────────────

/** English navigation triggers — appear BEFORE the destination */
export const NAV_TRIGGERS = [
    'navigate to', 'take me to', 'switch to', 'go to',
    'open', 'show', 'load',
];

/** English action triggers — appear BEFORE the target */
export const ACTION_TRIGGERS = ['create', 'make', 'add', 'new'];

/**
 * Hindi / Hinglish navigation triggers — appear AFTER the destination.
 * Examples: "dashboard kholo", "market watch dikhao", "डैशबोर्ड खोलो"
 */
export const HINDI_NAV_TRIGGERS = [
    // Devanagari
    'खोलो', 'खोलना', 'दिखाओ', 'दिखाना', 'जाओ', 'चलो', 'देखो',
    'पर जाओ', 'पे जाओ', 'पर चलो',
    // Hinglish (Roman)
    'kholo', 'kholna', 'dikhao', 'dikhana', 'jao', 'chalo', 'dekho',
    'par jao', 'pe jao', 'par chalo',
    'open karo', 'show karo', 'load karo',
];

/**
 * Hindi / Hinglish action triggers — appear AFTER or BEFORE the target.
 * Examples: "trading client banao", "naya broker", "ट्रेडिंग क्लाइंट बनाओ"
 */
export const HINDI_ACTION_TRIGGERS = [
    // Devanagari (suffix triggers)
    'बनाओ', 'बनाना', 'जोड़ो', 'जोड़ना', 'बनाएं',
    // Devanagari (prefix triggers)
    'नया', 'नई', 'नए',
    // Hinglish suffix
    'banao', 'banana', 'jodo', 'jodna', 'add karo', 'create karo', 'bana', 'banaye',
    // Hinglish prefix
    'naya', 'nayi', 'naye',
];

/** Hindi filler words to strip before matching */
export const HINDI_FILLER_WORDS = [
    'ज़रा', 'zara', 'please', 'karo', 'कृपया', 'मुझे', 'mujhe',
    'bhi', 'भी', 'toh', 'तो',
];

/** All filler words (English + Hindi) */
export const FILLER_WORDS = [
    'please', 'can you', 'could you', 'i want to', 'i need to', 'hey', 'ok', 'okay',
    'ज़रा', 'zara', 'कृपया', 'मुझे', 'mujhe',
];

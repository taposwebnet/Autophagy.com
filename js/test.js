'use strict';
/* ================= channels & config ================= */
const EMAILJS_CFG = {
    SERVICE: "",
    TEMPLATE: "",
    PUBLIC_KEY: ""
};
const CALLMEBOT_KEY = "";

const AZ_COMM_RATE = 0.095;
const AZ_EST_CPC = 0.01;
let adminMode = false;

/* ================= utils ================= */
const $ = (s, r=document) => r.querySelector(s)
  , $$ = (s, r=document) => [...r.querySelectorAll(s)];
const uid = () => 'id' + Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));
const fmtText = s => esc(s).replace(/#([\p{L}\p{N}_]{2,30})/gu, '<button class="ht" data-act="htag" data-tag="$1">#$1</button>').replace(/(https?:\/\/[^\s<]+)/g, '<a class="nlink" href="$1" target="_blank" rel="noopener">🔗 $1</a>');
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'k' : '' + Math.round(n);
const money = n => '$' + n.toFixed(2);
const hashStr = s => {
    let h = 1779033703;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19
    }
    return h >>> 0
}
;
const mulberry = a => () => {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}
;
const sha256 = (window.crypto && crypto.subtle) ? async t => {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ap::' + t));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
}
: async t => {
    let h = 5381;
    for (let i = 0; i < t.length; i++)
        h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
    return 'f' + h.toString(16) + t.length
}
;
const timeAgo = ts => {
    const s = (Date.now() - ts) / 1e3;
    return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'
}
;
const totp = async sec => ((await sha256(sec + Math.floor(Date.now() / 30000))).replace(/\D/g, '') + '000000').slice(0, 6);
const trUrl = (txt, lang) => 'https://translate.google.com/?sl=auto&tl=' + encodeURIComponent(lang || 'en') + '&text=' + encodeURIComponent((txt || '').slice(0, 4500)) + '&op=translate';

/* ================= icons ================= */
const I = {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    cmt: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    mic: '<path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
    vid: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l7-4v12l-7-4"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    wallet: '<path d="M19 7H5a2 2 0 0 1 0-4h12v4M19 7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5M16.5 13.5h.01"/>',
    shield: '<path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V5M9 13v2M15 13v2"/><circle cx="12" cy="3.5" r="1.5"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a15.6 15.6 0 0 1-3.1 4.1M6.6 6.6A15.9 15.9 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 4.2-.9"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    user: '<circle cx="12" cy="7.5" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M17.8 14.2a6.5 6.5 0 0 1 3.7 5.8"/>',
    feather: '<path d="M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5l6.7-6.8zM16 8L2 22M17.5 15H9"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    repeat: '<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
};
const ic = (n, st='') => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="${st}">${I[n] || ''}</svg>`;

/* ================= i18n — 24 languages ================= */
const LANGS = [['en', 'English'], ['bn', 'বাংলা'], ['hi', 'हिन्दी'], ['es', 'Español'], ['fr', 'Français'], ['ar', 'العربية'], ['zh', '中文'], ['pt', 'Português'], ['ru', 'Русский'], ['de', 'Deutsch'], ['ja', '日本語'], ['ko', '한국어'], ['it', 'Italiano'], ['tr', 'Türkçe'], ['id', 'Bahasa Indonesia'], ['vi', 'Tiếng Việt'], ['fa', 'فارسی'], ['ur', 'اردو'], ['uk', 'Українська'], ['pl', 'Polski'], ['nl', 'Nederlands'], ['sv', 'Svenska'], ['th', 'ไทย'], ['sw', 'Kiswahili']];
const RTL = new Set(['ar', 'fa', 'ur']);
const TAGLINES = {
    en: 'Say everything openly',
    bn: 'সব কথা খুলে বলো',
    hi: 'हर बात खुलकर कहो',
    es: 'Di todo abiertamente',
    fr: 'Dites tout ouvertement',
    ar: 'قل كل شيء بصراحة',
    zh: '坦然说出一切',
    pt: 'Diga tudo abertamente',
    ru: 'Говори всё открыто',
    de: 'Sag alles offen',
    ja: '何もかも、率直に語ろう',
    ko: '모든 것을 솔직하게 말하다',
    it: 'Di tutto apertamente',
    tr: 'Her şeyi açıkça söyle',
    id: 'Ucapkan segalanya terbuka',
    vi: 'Nói mọi điều thẳng thắn',
    fa: 'همه چیز را آشکار بگو',
    ur: 'سب کچھ کھل کر کہو',
    uk: 'Кажи все відкрито',
    pl: 'Mów wszystko otwarcie',
    nl: 'Zeg alles openlijk',
    sv: 'Säg allt öppet',
    th: 'พูดทุกอย่างอย่างเปิดเผย',
    sw: 'Sema yote wazi'
};
const D = {
    en: {
        tagline: 'Say everything openly',
        langsNote: '24 languages + Google Translate (100+)',
        m_profile: 'My Profile',
        m_msgs: 'Messages',
        m_login: 'Log in',
        m_logout: 'Log out',
        m_join: 'Join Autophagy',
        hero_h: 'Say {w} openly.',
        w_all: 'everything',
        hero_sub: 'A quiet room for loud feelings — write, record, show. Readers from every country, in their own language.',
        hero_cta: 'Write openly',
        voices: 'voices',
        countries: 'countries reading',
        languages_l: 'languages',
        ph_comp: 'Say everything openly… story, poem, travel, music, love…',
        publish: 'Publish',
        photo: 'Photo',
        voice: 'Voice',
        video: 'Video',
        anon: 'Anonymous',
        pick_feeling: 'Pick a topic first',
        posting_as: 'Publishing as',
        em_pain: 'Pain',
        em_suffer: 'Suffering',
        em_love: 'Love',
        t_story: 'Story',
        t_poem: 'Poem',
        t_travel: 'Travel',
        t_heritage: 'Heritage',
        t_music: 'Music',
        t_books: 'Books',
        all_f: 'All topics',
        like: 'Like',
        comment: 'Comment',
        share: 'Share',
        reads: 'reads',
        reply: 'Reply',
        ph_comment: 'Write a comment…',
        del: 'Delete',
        del_q: 'Delete this forever? This cannot be undone.',
        yes: 'Delete',
        cancel: 'Cancel',
        share_ok: 'Link copied',
        pub_ok: 'Published openly.',
        del_ok: 'Deleted.',
        large_file: 'Large file stays for this session only',
        follow: 'Follow',
        following: 'Following',
        msg: 'Message',
        follow_back: 'followed you back',
        msg_from: 'New message from',
        search_ph: 'Search your posts…',
        search_ph2: 'Search friends, groups & posts…',
        no_res: 'Nothing found.',
        view_prof: 'View profile',
        fs_t: 'Friend Search Box',
        groups: 'Groups',
        join: 'Join',
        joined: 'Joined',
        g_members: 'members',
        by_age: 'Readers by age',
        g_create: 'Create a group',
        g_share_az: 'Share Earn Zone links & earn more',
        t_posts: 'Posts',
        t_analytics: 'Analytics',
        t_earnings: 'Earnings',
        t_settings: 'Settings',
        t_security: 'Security',
        reads_total: 'Total reads',
        by_country: 'Readers by country',
        f_pct: 'Followers',
        uf_pct: 'Unfollowers',
        gross: 'Gross',
        fee: 'Autophagy 20%',
        net: 'Your net',
        avail: 'Available to withdraw',
        lifetime: 'Lifetime earnings',
        withdrawn: 'Withdrawn',
        withdraw: 'Withdraw',
        wd_t: 'Withdraw earnings',
        wd_amt: 'Amount (USD)',
        wd_m: 'Payment method',
        wd_acc: 'Account / wallet number',
        wd_go: 'Withdraw now',
        wd_min: 'Minimum withdrawal is $10.',
        wd_ok: 'Withdrawal requested',
        processing: 'Processing…',
        payout_t: 'Payout bank account (yours — editable anytime)',
        p_bank: 'Bank name',
        p_acc: 'Account number',
        p_holder: 'Account holder name',
        p_holder_note: 'Must match your display name',
        p_save: 'Save payout account',
        p_saved: 'Payout account saved.',
        wd_shot: 'Upload earnings screenshot',
        wd_72: 'Approved withdrawals reach your account within 72 hours.',
        wd_own: 'I confirm this account is in my own name',
        wd_name_err: 'must be your own display name:',
        s_name: 'Display name',
        s_bio: 'One-line bio',
        s_color: 'Profile color',
        s_cover: 'Cover photo',
        c_change: 'Change cover',
        c_upload: 'Upload cover image',
        c_remove: 'Remove cover',
        s_anon: 'Publish anonymously by default',
        save: 'Save',
        saved: 'Saved.',
        reset_prof: 'Reset profile to defaults',
        del_acc: 'Delete account',
        joined: 'Joined',
        pw_t: 'Change password',
        pw_cur: 'Current password',
        pw_new: 'New password (min 8)',
        pw_change: 'Update password',
        pw_ok: 'Password updated & re-hashed.',
        tfa: 'Two-factor authentication',
        tfa_d: 'A 6-digit code is required at every login.',
        sec_score: 'Security score',
        session: 'Active session',
        revoke: 'Revoke',
        alerts: 'Login alerts',
        reset_pw: 'Send reset link',
        reset_ok: 'Reset link sent to your recovery inbox (demo).',
        login_t: 'Welcome back',
        signup_t: 'Create your account',
        ph_name: 'Display name',
        ph_handle: '@handle',
        ph_pw: 'Password (min 8)',
        ph_country: 'Country',
        have_acc: 'Have an account? Log in',
        need_acc: 'New here? Create account',
        sign_in: 'Log in',
        join2: 'Join Autophagy',
        or_demo: 'or explore with the demo writer',
        forgot: 'Forgot password?',
        strength: 'Strength',
        su_nid: 'Your name (as on National ID)',
        su_cont: 'Mobile number or email',
        su_selfie: 'Upload selfie (verification — optional)',
        chat_t: 'Avo',
        chat_s: 'Autophagy guide · any language',
        chat_g: 'Hello — I’m Avo. Ask me anything about Autophagy, in your own language.',
        chat_ph: 'Ask in any language…',
        err_name: 'Enter your name.',
        err_pw: 'At least 8 characters.',
        err_creds: 'Wrong handle or password.',
        err_code: 'Wrong code.',
        err_lock: 'Too many failed attempts — locked for 2 minutes.',
        err_sess: 'Session expired — log in again.',
        insights: 'Insights',
        msg_ph: 'Write a message…',
        open: 'Open',
        following_n: 'Following',
        followers_n: 'Followers',
        posts_n: 'Posts',
        you: 'You',
        edit: 'Edit name',
        wd_fee_note: 'The 20% platform share is already excluded from your balance.',
        blocked_note: 'items were blocked by the sponge filter',
        spam_n: 'Policy notice',
        ad_t: 'Advertisement',
        ad_b: 'Autophagy Plus — ad-free reading, deeper insights, priority withdrawal.',
        c_country: 'Change country',
        comments: 'comments',
        bm: 'Save',
        bmd: 'Saved',
        t_saved: 'Saved',
        no_saved: 'Nothing saved yet.',
        trending: 'Trending now',
        notif_t: 'Notifications',
        mark_read: 'Mark all read',
        no_notif: 'No notifications yet.',
        n_like: 'liked your post',
        n_comment: 'commented on your post',
        n_followback: 'followed you back',
        rec_now: 'Recording… tap the mic to stop',
        rec_ok: 'Voice attached',
        rec_err: 'Microphone permission needed',
        advertise: 'Advertise',
        ad_t2: 'Advertise on Autophagy',
        ad_sub: 'Feed · Header · Footer · Pop-up — Video · Banner · Poster · Placard · Photocard · Animation — every country',
        ad_brand: 'Brand / Name',
        ad_email: 'Email',
        ad_type: 'Ad type',
        ad_pay: 'Pay now',
        bank_t: 'Pay to — Autophagy PLC',
        bank_ac: 'Bank account number',
        bank_conf: 'Account holder name: confidential 🔒',
        ad_sum: 'Your ad summary',
        ad_paid: 'Submit ad for verification',
        ad_ok: 'Payment verified — ad is live.',
        ad_live: 'LIVE',
        your_ad: 'Your ad here',
        ad_rev: 'Revenue → Autophagy PLC',
        adsense_note: 'Google AdSense · geo-targeted · shows here',
        ad_default_msg: 'Say everything openly.',
        ad_up_t: 'Upload your ad creative',
        ad_up_s: 'Video · Banner · Poster · Placard · Photocard — tap here to upload',
        ad_pending_to: 'Ad received — payment verification in progress. It goes live only after the authority confirms payment.',
        my_ads: 'My advertisements',
        st_pending: 'Pending — verifying payment',
        st_live: 'Live',
        st_rej: 'Payment not received — not live',
        ad_admin_t: 'Ad approvals — Authority',
        ad_pin: 'Authority PIN',
        ad_approve: 'Payment verified — go live',
        ad_reject: 'Payment not received',
        ad_rej_msg: 'Payment not received — your advertisement was not activated.',
        ad_none: 'No pending ads.',
        admin_ok: 'Authority access granted.',
        ad_email_rej: '📧 Non-payment notice emailed to the advertiser',
        p_trx: 'Transaction ID (TRX / Reference)',
        p_shot: 'Payment confirmation screenshot',
        p_trx_req: 'Enter the TRX ID you received after paying',
        ad_v_note: 'After paying, submit the TRX ID + screenshot. The authority verifies them against the bank/wallet statement.',
        ad_paid_next: 'I have paid — enter payment details',
        n_pay_ok: '✅ Payment verified — your ad is now live',
        n_pay_no: '❌ Payment not found — your ad was not activated. Contact: tautophagy@gmail.com / WhatsApp +8801671451195',
        ad_dur: 'Ad duration',
        ad_total: 'Total payment',
        ad_perday: 'per day',
        ad_permonth: 'per month',
        ad_expiry: 'Displays until',
        ad_rate_t: 'Rate card — base price per duration (Feed)',
        ad_days_left: 'days left',
        st_expired: 'Expired',
        ad_saved: 'Longer plans save',
        dur_3: '3 days',
        dur_10: '10 days',
        dur_30: '1 month · 30 days',
        dur_90: '3 months',
        dur_180: '6 months',
        dur_365: '1 year',
        ad_phone: 'Phone / WhatsApp',
        n_send_ok: '📤 Success message sent to advertiser (email/WhatsApp)',
        n_send_rej: '📤 Rejection notice sent to advertiser',
        place_t: 'Ad placement',
        pl_feed: '🎞️ Feed slider',
        pl_header: '📌 Header strip',
        pl_footer: '📄 Footer strip',
        pl_pop: '🎪 Pop-up · site-wide',
        pop_size: 'Pop-up size',
        size_s: 'Small',
        size_l: 'Large',
        mult_feed: '×1.0',
        mult_mid: '×1.2',
        mult_pop: '×1.5',
        final_price: 'Final price',
        az_t: 'Earn Zone — Share & Earn',
        az_sub: 'Share your ad-network links — other Autophagy users click and you earn directly!',
        az_add: 'Add your ad link',
        az_net: 'Network',
        az_url: 'Your link URL',
        az_title: 'Link title',
        az_share: 'Share link',
        az_mine: 'My shared links',
        az_all: 'All shared links',
        az_clicks: 'clicks',
        az_copy: 'Copy',
        az_open: 'Click — open & earn',
        az_how: 'How it works',
        az_del_l: 'Delete link',
        az_empty: 'No links shared yet. Be the first!',
        az_net_pick: 'Choose network',
        az_how_d: '1. Create a free account on any ad network (Adsterra, Monetag, TerraBox, AdSense, Google Ad Link).\n2. Get your referral / promo / direct link.\n3. Add it here in the Earn Zone.\n4. Other Autophagy users from every country click your link.\n5. The ad network pays you directly — Autophagy keeps only a small 5% commission.\n\n⚠️ Only share legitimate ad-network links. Spam links are sponged instantly.',
        az_myearn: 'My estimated network earnings',
        az_est: 'estimated — real payout shows in your ad-network dashboard',
        az_withdrawn: 'Withdrawn',
        az_wd: 'Withdraw network income (gateway)',
        az_wd_note: 'Autophagy deducts a 5% commission from every payout.',
        az_wd_ok: 'Withdrawal requested — 5% commission collected',
        az_pool: 'Commission pool (5%)',
        az_comm_note: 'Every network payout carries a 5% Autophagy commission, collected at withdrawal and sent to Autophagy PLC.',
        az_img: 'Cover image (tap to open link)',
        az_img_pick: 'Upload image',
        az_desc: 'Description text',
        az_desc_ph: 'Write anything here — story, offer, details…',
        az_cta: 'Click — open & earn',
        bank_edit: 'Autophagy bank / gateway (editable anytime)',
        bank_bkash: 'bKash Merchant',
        bank_nagad: 'Nagad',
        bank_rocket: 'Rocket',
        bank_saved: 'Bank / gateway updated.',
        repost: 'Repost',
        repost_ok: 'Reposted to your wall',
        n_repost: 'reposted your content',
        r_by: 'shared from',
        tr_tip: 'Read in your language',
        tr_note: 'Any language → your language',
        about_t: 'About Autophagy',
        about_ph: 'Write about the founder…',
        help_t: 'Help & Support',
        email_sent: '📧 Policy notice emailed to your login address',
        logo_chg: 'Change logo',
        logo_ok: 'Logo updated.',
        news_ok: 'News links OK',
        news_foot: 'Share news & social links as posts',
        cur_note: 'International value'
    },
    bn: {
        tagline: 'সব কথা খুলে বলো',
        langsNote: '২৪টি ভাষা + গুগল ট্রান্সলেট (১০০+)',
        m_profile: 'আমার প্রোফাইল',
        m_msgs: 'মেসেজ',
        m_login: 'লগ ইন',
        m_logout: 'লগ আউট',
        m_join: 'অটোফেজিতে যোগ দিন',
        hero_h: '{w} খুলে বলো।',
        w_all: 'সব কথা',
        hero_sub: 'জোরালো অনুভূতির জন্য শান্ত একটা ঘর — লেখো, রেকর্ড করো, দেখাও। প্রতিটি দেশের পাঠক, তাদের নিজের ভাষায়।',
        hero_cta: 'মন খুলে লেখো',
        voices: 'কণ্ঠস্বর',
        countries: 'দেশ পড়ছে',
        languages_l: 'ভাষা',
        ph_comp: 'সব কথা খুলে বলো… গল্প, কবিতা, ভ্রমণ, সংগীত, ভালোবাসা…',
        publish: 'প্রকাশ',
        photo: 'ছবি',
        voice: 'কণ্ঠ',
        video: 'ভিডিও',
        anon: 'নাম গোপন',
        pick_feeling: 'আগে একটা বিষয় বাছো',
        posting_as: 'লিখছেন',
        em_pain: 'ব্যথা',
        em_suffer: 'কষ্ট',
        em_love: 'প্রেম',
        t_story: 'গল্প',
        t_poem: 'কবিতা',
        t_travel: 'ভ্রমণ',
        t_heritage: 'পুরাকীর্তি',
        t_music: 'সংগীত',
        t_books: 'বই আলোচনা',
        all_f: 'সব বিষয়',
        like: 'পছন্দ',
        comment: 'মন্তব্য',
        share: 'শেয়ার',
        reads: 'পাঠ',
        reply: 'উত্তর',
        ph_comment: 'মন্তব্য লেখো…',
        del: 'মুছুন',
        del_q: 'চিরতরে মুছে ফেলবেন? ফিরে আসবে না।',
        yes: 'মুছুন',
        cancel: 'বাতিল',
        share_ok: 'লিংক কপি হয়েছে',
        pub_ok: 'খুলে প্রকাশিত হলো।',
        del_ok: 'মুছে ফেলা হয়েছে।',
        large_file: 'বড় ফাইল শুধু এই সেশনে থাকবে',
        follow: 'ফলো',
        following: 'ফলোইং',
        msg: 'মেসেজ',
        follow_back: 'আপনাকে ফলো ফেরত করেছে',
        msg_from: 'নতুন মেসেজ —',
        search_ph: 'নিজের পোস্ট খুঁজুন…',
        search_ph2: 'বন্ধু, গ্রুপ ও পোস্ট খুঁজুন…',
        no_res: 'কিছু পাওয়া যায়নি।',
        view_prof: 'প্রোফাইল দেখুন',
        fs_t: 'ফ্রেন্ড সার্চ বক্স',
        groups: 'গ্রুপসমূহ',
        join: 'যোগ দিন',
        joined: 'যোগ দিয়েছেন',
        g_members: 'সদস্য',
        by_age: 'বয়সভিত্তিক পাঠক',
        g_create: 'গ্রুপ খুলুন',
        g_share_az: 'আর্ন জোনের লিংক শেয়ার করে বেশি আয় করুন',
        t_posts: 'পোস্ট',
        t_analytics: 'অ্যানালিটিক্স',
        t_earnings: 'আয়',
        t_settings: 'সেটিংস',
        t_security: 'নিরাপত্তা',
        reads_total: 'মোট পাঠ',
        by_country: 'দেশভিত্তিক পাঠক',
        f_pct: 'ফলোয়ার',
        uf_pct: 'আন-ফলোয়ার',
        gross: 'মোট',
        fee: 'অটোফেজি ২০%',
        net: 'আপনার নিট',
        avail: 'উত্তোলনযোগ্য',
        lifetime: 'সারাজীবনের আয়',
        withdrawn: 'উত্তোলিত',
        withdraw: 'উত্তোলন',
        wd_t: 'আয় উত্তোলন',
        wd_amt: 'পরিমাণ (USD)',
        wd_m: 'পেমেন্ট মাধ্যম',
        wd_acc: 'অ্যাকাউন্ট / ওয়ালেট নম্বর',
        wd_go: 'এখনই উত্তোলন',
        wd_min: 'সর্বনিম্ন উত্তোলন $১০।',
        wd_ok: 'উত্তোলনের অনুরোধ জমা হয়েছে',
        processing: 'প্রক্রিয়াধীন…',
        payout_t: 'পেমেন্ট ব্যাংক একাউন্ট (আপনার — যেকোনো সময় বদলানো যায়)',
        p_bank: 'ব্যাংকের নাম',
        p_acc: 'একাউন্ট নাম্বার',
        p_holder: 'একাউন্টের নাম',
        p_holder_note: 'আপনার প্রদর্শিত নামের সাথে মিলতে হবে',
        p_save: 'সেভ করুন',
        p_saved: 'পেমেন্ট একাউন্ট সেভ হয়েছে।',
        wd_shot: 'আয়ের স্ক্রিনশট দিন',
        wd_72: 'অনুমোদনের ৭২ ঘণ্টার মধ্যে টাকা আপনার একাউন্টে পৌঁছাবে।',
        wd_own: 'আমি নিশ্চিত করছি — একাউন্টটি আমার নিজের নামে',
        wd_name_err: 'আপনার নিজের নাম হতে হবে:',
        s_name: 'প্রদর্শন নাম',
        s_bio: 'এক লাইনের পরিচয়',
        s_color: 'প্রোফাইল রঙ',
        s_cover: 'প্রোফাইল কভার',
        c_change: 'কভার বদলান',
        c_upload: 'নিজের ছবি দিন',
        c_remove: 'কভার সরান',
        s_anon: 'সবসময় নাম গোপনে প্রকাশ',
        save: 'সংরক্ষণ',
        saved: 'সংরক্ষিত হয়েছে।',
        reset_prof: 'প্রোফাইল রিসেট করুন',
        del_acc: 'অ্যাকাউন্ট মুছুন',
        joined: 'যোগ দিয়েছেন',
        pw_t: 'পাসওয়ার্ড বদলান',
        pw_cur: 'বর্তমান পাসওয়ার্ড',
        pw_new: 'নতুন পাসওয়ার্ড (ন্যূনতম ৮)',
        pw_change: 'পাসওয়ার্ড হালনাগাদ',
        pw_ok: 'পাসওয়ার্ড হালনাগাদ ও হ্যাশ সম্পন্ন।',
        tfa: 'দুই-স্তরের যাচাই',
        tfa_d: 'প্রতিবার লগ ইনে ৬-সংখ্যার কোড লাগবে।',
        sec_score: 'নিরাপত্তা স্কোর',
        session: 'সক্রিয় সেশন',
        revoke: 'বাতিল',
        alerts: 'লগ ইন সতর্কতা',
        reset_pw: 'রিসেট লিংক পাঠান',
        reset_ok: 'রিকভারি ইনবক্সে রিসেট লিংক পাঠানো হয়েছে।',
        login_t: 'ফিরে আসার জন্য ধন্যবাদ',
        signup_t: 'আপনার একাউন্ট তৈরি করুন',
        ph_name: 'প্রদর্শন নাম',
        ph_handle: '@হ্যান্ডেল',
        ph_pw: 'পাসওয়ার্ড (ন্যূনতম ৮)',
        ph_country: 'দেশ',
        have_acc: 'অ্যাকাউন্ট আছে? লগ ইন',
        need_acc: 'নতুন? অ্যাকাউন্ট খুলুন',
        sign_in: 'লগ ইন',
        join2: 'অটোফেজিতে যোগ দিন',
        or_demo: 'অথবা ডেমো লেখক হিসেবে দেখুন',
        forgot: 'পাসওয়ার্ড ভুলে গেছেন?',
        strength: 'শক্তি',
        su_nid: 'জাতীয় পরিচয়পত্র ইস্যু অনুযায়ী আপনার নাম',
        su_cont: 'মোবাইল নম্বর অথবা ইমেইল',
        su_selfie: 'সেলফি আপলোড (ভেরিফিকেশন — ঐচ্ছিক)',
        chat_t: 'আভো',
        chat_s: 'অটোফেজি গাইড · যেকোনো ভাষা',
        chat_g: 'হ্যালো — আমি আভো। অটোফেজি নিয়ে যা চাও জিজ্ঞাসা করো, তোমার ভাষায়।',
        chat_ph: 'যেকোনো ভাষায় জিজ্ঞাসা করুন…',
        err_name: 'নাম লিখুন।',
        err_pw: 'কমপক্ষে ৮ অক্ষর।',
        err_creds: 'হ্যান্ডেল বা পাসওয়ার্ড ভুল।',
        err_code: 'কোড ভুল।',
        err_lock: 'অনেকবার ভুল — ২ মিনিটের জন্য লক।',
        err_sess: 'সেশন শেষ — আবার লগ ইন করুন।',
        insights: 'ইনসাইট',
        msg_ph: 'মেসেজ লেখো…',
        open: 'খুলুন',
        following_n: 'ফলোইং',
        followers_n: 'ফলোয়ার',
        posts_n: 'পোস্ট',
        you: 'আপনি',
        edit: 'নাম বদলান',
        wd_fee_note: '২০% প্ল্যাটফর্ম ভাগ ব্যালেন্স থেকে বাদই দেওয়া হয়েছে।',
        blocked_note: 'টি কনটেন্ট স্পঞ্জ ফিল্টারে ব্লক হয়েছে',
        spam_n: 'নীতি নোটিশ',
        ad_t: 'বিজ্ঞাপন',
        ad_b: 'অটোফেজি প্লাস — বিজ্ঞাপনমুক্ত পড়া, গভীর ইনসাইট, অগ্রাধিকার উত্তোলন।',
        c_country: 'দেশ বদলান',
        comments: 'মন্তব্য',
        bm: 'সেভ',
        bmd: 'সেভ হয়েছে',
        t_saved: 'সেভ করা পোস্ট',
        no_saved: 'এখনো কিছু সেভ করেননি।',
        trending: 'এখন ট্রেন্ডিং',
        notif_t: 'নোটিফিকেশন',
        mark_read: 'সব পড়া হয়েছে',
        no_notif: 'এখনো কোনো নোটিফিকেশন নেই।',
        n_like: 'আপনার পোস্ট পছন্দ করেছে',
        n_comment: 'আপনার পোস্টে মন্তব্য করেছে',
        n_followback: 'আপনাকে ফলো ফেরত করেছে',
        rec_now: 'রেকর্ড হচ্ছে… থামাতে মাইকে চাপ দিন',
        rec_ok: 'ভয়েস যোগ হয়েছে',
        rec_err: 'মাইক্রোফোনের অনুমতি দিন',
        advertise: 'বিজ্ঞাপন দিন',
        ad_t2: 'অটোফজিতে বিজ্ঞাপন দিন',
        ad_sub: 'ফিড · হেডার · ফুটার · পপ-আপ — ভিডিও · ব্যানার · পোস্টার · প্ল্যাকার্ড · ফটোকার্ড · অ্যানিমেশন — সব দেশের জন্য',
        ad_brand: 'ব্র্যান্ড / নাম',
        ad_email: 'ইমেইল',
        ad_type: 'বিজ্ঞাপনের ধরন',
        ad_pay: 'এখনই পেমেন্ট করুন',
        bank_t: 'পেমেন্ট করুন — অটোফজি পিএলসি',
        bank_ac: 'ব্যাংক একাউন্ট নাম্বার',
        bank_conf: 'একাউন্টের নাম: গোপন 🔒',
        ad_sum: 'আপনার বিজ্ঞাপনের সারাংশ',
        ad_paid: 'যাচাইয়ের জন্য জমা দিন',
        ad_ok: 'পেমেন্ট যাচাই হয়েছে — বিজ্ঞাপন লাইভ।',
        ad_live: 'লাইভ',
        your_ad: 'আপনার বিজ্ঞাপন এখানে',
        ad_rev: 'আয় → অটোফজি পিএলসি',
        adsense_note: 'গুগল অ্যাডসেন্স · দেশভিত্তিক · এখানে প্রদর্শিত হবে',
        ad_default_msg: 'সব কথা খুলে বলো।',
        ad_up_t: 'আপনার বিজ্ঞাপনের ফাইল আপলোড দিন',
        ad_up_s: 'ভিডিও · ব্যানার · পোস্টার · প্ল্যাকার্ড · ফটোকার্ড — আপলোড করতে এখানে চাপ দিন',
        ad_pending_to: 'বিজ্ঞাপন জমা হয়েছে — পেমেন্ট যাচাই চলছে। কর্তৃপক্ষ পেমেন্ট নিশ্চিত করলেই লাইভ হবে।',
        my_ads: 'আমার বিজ্ঞাপনসমূহ',
        st_pending: 'অপেক্ষমাণ — পেমেন্ট যাচাই চলছে',
        st_live: 'লাইভ',
        st_rej: 'পেমেন্ট হয়নি — চালু হয়নি',
        ad_admin_t: 'বিজ্ঞাপন অনুমোদন — কর্তৃপক্ষ',
        ad_pin: 'কর্তৃপক্ষের PIN',
        ad_approve: 'পেমেন্ট যাচাই হয়েছে — লাইভ করুন',
        ad_reject: 'পেমেন্ট হয়নি',
        ad_rej_msg: 'পেমেন্ট করা হয়নি — তাই আপনার বিজ্ঞাপনটি চালু হয়নি।',
        ad_none: 'অপেক্ষমাণ কোনো বিজ্ঞাপন নেই।',
        admin_ok: 'কর্তৃপক্ষের প্রবেশ অনুমোদিত।',
        ad_email_rej: '📧 অ-পরিশোধের নোটিশ বিজ্ঞাপনদাতার ইমেইলে গেছে',
        p_trx: 'ট্রানজেকশন আইডি (TRX / রেফারেন্স)',
        p_shot: 'পেমেন্ট কনফারমেশন স্ক্রিনশট',
        p_trx_req: 'পেমেন্টের পর পাওয়া TRX আইডিটি লিখুন',
        ad_v_note: 'পেমেন্ট করার পর TRX আইডি + স্ক্রিনশট জমা দিন। কর্তৃপক্ষ ব্যাংক/ওয়ালেট স্টেটমেন্টের সাথে মিলিয়ে দেখবে।',
        ad_paid_next: 'পেমেন্ট করেছি — এখন তথ্য দিন',
        n_pay_ok: '✅ পেমেন্ট যাচাই হয়েছে — আপনার বিজ্ঞাপন সফলভাবে লাইভ হয়েছে!',
        n_pay_no: '❌ পেমেন্ট পাওয়া যায়নি — আপনার বিজ্ঞাপন চালু হয়নি। যোগাযোগ: tautophagy@gmail.com / WhatsApp +8801671451195',
        ad_dur: 'বিজ্ঞাপনের মেয়াদ',
        ad_total: 'মোট পেমেন্ট',
        ad_perday: 'দিন হারে',
        ad_permonth: 'মাস হারে',
        ad_expiry: 'প্রদর্শন চলবে',
        ad_rate_t: 'রেট কার্ড — মেয়াদ ভিত্তিক মূল দাম (ফিড)',
        ad_days_left: 'দিন বাকি',
        st_expired: 'মেয়াদ শেষ',
        ad_saved: 'বড় প্যাকেজে সাশ্রয়',
        dur_3: '৩ দিন',
        dur_10: '১০ দিন',
        dur_30: '১ মাস · ৩০ দিন',
        dur_90: '৩ মাস',
        dur_180: '৬ মাস',
        dur_365: '১ বছর',
        ad_phone: 'ফোন / WhatsApp',
        n_send_ok: '📤 সফলতার বার্তা বিজ্ঞাপনদাতার ইমেইল/ফোনে পাঠানো হয়েছে',
        n_send_rej: '📤 বিজ্ঞাপনদাতাকে বিফল-নোটিশ পাঠানো হয়েছে',
        place_t: 'বিজ্ঞাপনের অবস্থান',
        pl_feed: '🎞️ ফিড স্লাইডার',
        pl_header: '📌 হেডার স্ট্রিপ',
        pl_footer: '📄 ফুটার স্ট্রিপ',
        pl_pop: '🎪 পপ-আপ · সারা সাইটে',
        pop_size: 'পপ-আপের আকার',
        size_s: 'ছোট',
        size_l: 'বড়',
        mult_feed: '×1.0',
        mult_mid: '×1.2',
        mult_pop: '×1.5',
        final_price: 'চূড়ান্ত মূল্য',
        az_t: 'আর্ন জোন — শেয়ার করে আয় করুন',
        az_sub: 'আপনার অ্যাড-নেটওয়ার্ক লিংক শেয়ার করুন — অন্য অটোফজি ব্যবহারকারী ক্লিক করলেই সরাসরি আয়!',
        az_add: 'আপনার অ্যাড লিংক যোগ করুন',
        az_net: 'নেটওয়ার্ক',
        az_url: 'আপনার লিংক URL',
        az_title: 'লিংকের শিরোনাম',
        az_share: 'লিংক শেয়ার করুন',
        az_mine: 'আমার শেয়ার করা লিংক',
        az_all: 'সব শেয়ার করা লিংক',
        az_clicks: 'ক্লিক',
        az_copy: 'কপি',
        az_open: 'ক্লিক দিন, খুলুন ও আয় করুন',
        az_how: 'কীভাবে কাজ করে',
        az_del_l: 'লিংক মুছুন',
        az_empty: 'এখনো কোনো লিংক শেয়ার করা হয়নি। প্রথম হোন!',
        az_net_pick: 'নেটওয়ার্ক বাছুন',
        az_how_d: '১. যেকোনো অ্যাড নেটওয়ার্কে (Adsterra, Monetag, TerraBox, AdSense, Google Ad Link) ফ্রি অ্যাকাউন্ট খুলুন।\n২. আপনার রেফারেল / প্রমো / ডিরেক্ট লিংক নিন।\n৩. এখানে আর্ন জোনে যোগ করুন।\n৪. সব দেশের অন্য অটোফজি ব্যবহারকারী আপনার লিংকে ক্লিক করবে।\n৫. অ্যাড নেটওয়ার্ক সরাসরি আপনাকে টাকা দেবে — অটোফজি রাখবে মাত্র ছোট্ট ৫% কমিশন।\n\n⚠️ শুধু বৈধ অ্যাড-নেটওয়ার্ক লিংক শেয়ার করুন। স্প্যাম লিংক মুহূর্তে স্পঞ্জ হবে।',
        az_myearn: 'আমার আনুমানিক নেটওয়ার্ক আয়',
        az_est: 'আনুমানিক — আসল পেমেন্ট আপনার অ্যাড-নেটওয়ার্ক ড্যাশবোর্ডে দেখা যাবে',
        az_withdrawn: 'উত্তোলিত',
        az_wd: 'নেটওয়ার্ক আয় উত্তোলন (গেটওয়ে)',
        az_wd_note: 'প্রতিটি পেআউট থেকে অটোফজি ৫% কমিশন কাটবে।',
        az_wd_ok: 'উত্তোলনের অনুরোধ জমা — ৫% কমিশন সংগ্রহ হয়েছে',
        az_pool: 'কমিশন পুল (৫%)',
        az_comm_note: 'প্রতিটি নেটওয়ার্ক পেআউটে ৫% অটোফজি কমিশন — উত্তোলনের সময় সংগ্রহ হয়ে অটোফজি পিএলসিতে যায়।',
        az_img: 'কভার ছবি (ছবিতে ক্লিক করলেই লিংক খুলবে)',
        az_img_pick: 'ছবি আপলোড দিন',
        az_desc: 'বর্ণনা লেখা',
        az_desc_ph: 'যা খুশি লিখুন — গল্প, অফার, বিস্তারিত…',
        az_cta: 'ক্লিক দিন, খুলুন ও আয় করুন',
        bank_edit: 'অটোফজির ব্যাংক / গেটওয়ে (প্রয়োজনে যেকোনো সময় বদলান)',
        bank_bkash: 'বিকাশ মার্চেন্ট',
        bank_nagad: 'নগদ',
        bank_rocket: 'রকেট',
        bank_saved: 'ব্যাংক / গেটওয়ে হালনাগাদ হয়েছে।',
        repost: 'শেয়ার করুন',
        repost_ok: 'আপনার ওয়ালে শেয়ার হয়েছে',
        n_repost: 'আপনার কন্টেন্ট শেয়ার করেছে',
        r_by: 'শেয়ার উৎস',
        tr_tip: 'আপনার ভাষায় পড়ুন',
        tr_note: 'যেকোনো ভাষা → আপনার ভাষা',
        about_t: 'আমাদের সম্পর্কে',
        about_ph: 'প্রতিষ্ঠাতা সম্পর্কে লিখুন…',
        help_t: 'হেল্প ও সাপোর্ট',
        email_sent: '📧 নীতি-নোটিশ আপনার ইমেইলে পাঠানো হয়েছে',
        logo_chg: 'লোগো বদলান',
        logo_ok: 'লোগো বদলেছে।',
        news_ok: 'নিউজ লিংক চলবে',
        news_foot: 'নিউজ ও সোশ্যাল লিংক পোস্ট আকারে শেয়ার করুন',
        cur_note: 'আন্তর্জাতিক মান'
    },
    es: {
        tagline: 'Di todo abiertamente',
        m_profile: 'Mi perfil',
        m_msgs: 'Mensajes',
        m_login: 'Iniciar sesión',
        m_logout: 'Salir',
        m_join: 'Únete a Autophagy',
        sign_in: 'Iniciar sesión',
        publish: 'Publicar',
        like: 'Me gusta',
        comment: 'Comentar',
        share: 'Compartir',
        anon: 'Anónimo',
        follow: 'Seguir',
        photo: 'Foto',
        voice: 'Voz',
        video: 'Vídeo',
        hero_cta: 'Escribir abiertamente',
        withdraw: 'Retirar',
        t_earnings: 'Ingresos',
        all_f: 'Todos',
        reads: 'lecturas',
        chat_ph: 'Pregunta en cualquier idioma…',
        t_story: 'Historia',
        t_poem: 'Poema',
        t_travel: 'Viaje',
        t_heritage: 'Patrimonio',
        t_music: 'Música',
        t_books: 'Libros'
    },
    fr: {
        tagline: 'Dites tout ouvertement',
        m_profile: 'Mon profil',
        m_msgs: 'Messages',
        m_login: 'Connexion',
        m_logout: 'Déconnexion',
        m_join: 'Rejoindre Autophagy',
        sign_in: 'Connexion',
        publish: 'Publier',
        like: 'J’aime',
        comment: 'Commenter',
        share: 'Partager',
        anon: 'Anonyme',
        follow: 'Suivre',
        photo: 'Photo',
        voice: 'Voix',
        video: 'Vidéo',
        hero_cta: 'Écrire ouvertement',
        withdraw: 'Retirer',
        t_earnings: 'Revenus',
        all_f: 'Tous',
        reads: 'lectures',
        chat_ph: 'Demandez dans n’importe quelle langue…',
        t_story: 'Histoire',
        t_poem: 'Poème',
        t_travel: 'Voyage',
        t_heritage: 'Patrimoine',
        t_music: 'Musique',
        t_books: 'Livres'
    },
    ar: {
        tagline: 'قل كل شيء بصراحة',
        m_profile: 'ملفي',
        m_msgs: 'الرسائل',
        m_login: 'تسجيل الدخول',
        m_logout: 'خروج',
        m_join: 'انضم إلى أوتوفاجي',
        sign_in: 'دخول',
        publish: 'انشر',
        like: 'إعجاب',
        comment: 'تعليق',
        share: 'مشاركة',
        anon: 'مجهول',
        follow: 'متابعة',
        photo: 'صورة',
        voice: 'صوت',
        video: 'فيديو',
        hero_cta: 'اكتب بصراحة',
        withdraw: 'سحب',
        t_earnings: 'الأرباح',
        all_f: 'الكل',
        reads: 'قراءة',
        chat_ph: 'اسأل بأي لغة…',
        t_story: 'قصة',
        t_poem: 'قصيدة',
        t_travel: 'سفر',
        t_heritage: 'تراث',
        t_music: 'موسيقى',
        t_books: 'كتب'
    },
    hi: {
        tagline: 'हर बात खुलकर कहो',
        m_profile: 'मेरी प्रोफ़ाइल',
        m_msgs: 'संदेश',
        m_login: 'लॉग इन',
        m_logout: 'लॉग आउट',
        m_join: 'ऑटोफेजी से जुड़ें',
        sign_in: 'लॉग इन',
        publish: 'प्रकाशित करें',
        like: 'पसंद',
        comment: 'टिप्पणी',
        share: 'साझा',
        anon: 'गुमनाम',
        follow: 'फ़ॉलो',
        photo: 'तस्वीर',
        voice: 'आवाज़',
        video: 'वीडियो',
        hero_cta: 'खुलकर लिखो',
        withdraw: 'निकालें',
        t_earnings: 'कमाई',
        all_f: 'सब',
        reads: 'पठन',
        chat_ph: 'किसी भी भाषा में पूछें…',
        t_story: 'कहानी',
        t_poem: 'कविता',
        t_travel: 'यात्रा',
        t_heritage: 'धरोहर',
        t_music: 'संगीत',
        t_books: 'पुस्तकें'
    },
    zh: {
        tagline: '坦然说出一切',
        m_profile: '我的主页',
        m_msgs: '消息',
        m_login: '登录',
        m_logout: '退出',
        m_join: '加入 Autophagy',
        sign_in: '登录',
        publish: '发布',
        like: '喜欢',
        comment: '评论',
        share: '分享',
        anon: '匿名',
        follow: '关注',
        photo: '图片',
        voice: '语音',
        video: '视频',
        hero_cta: '坦然书写',
        withdraw: '提现',
        t_earnings: '收益',
        all_f: '全部',
        reads: '阅读',
        chat_ph: '用任何语言提问…',
        t_story: '故事',
        t_poem: '诗',
        t_travel: '旅行',
        t_heritage: '古迹',
        t_music: '音乐',
        t_books: '读书'
    },
    pt: {
        tagline: 'Diga tudo abertamente',
        m_profile: 'Meu perfil',
        m_msgs: 'Mensagens',
        m_login: 'Entrar',
        m_logout: 'Sair',
        publish: 'Publicar',
        like: 'Curtir',
        comment: 'Comentar',
        share: 'Compartilhar',
        anon: 'Anônimo',
        follow: 'Seguir',
        sign_in: 'Entrar',
        join2: 'Junte-se ao Autophagy',
        chat_ph: 'Pergunte em qualquer idioma…',
        withdraw: 'Sacar',
        t_earnings: 'Ganhos',
        all_f: 'Todos'
    },
    ru: {
        tagline: 'Говори всё открыто',
        m_profile: 'Мой профиль',
        m_msgs: 'Сообщения',
        m_login: 'Войти',
        m_logout: 'Выйти',
        publish: 'Опубликовать',
        like: 'Нравится',
        comment: 'Комментировать',
        share: 'Поделиться',
        anon: 'Анонимно',
        follow: 'Подписаться',
        sign_in: 'Войти',
        join2: 'Присоединяйся к Autophagy',
        chat_ph: 'Спрашивай на любом языке…',
        withdraw: 'Вывести',
        t_earnings: 'Доход',
        all_f: 'Все'
    },
    de: {
        tagline: 'Sag alles offen',
        m_profile: 'Mein Profil',
        m_msgs: 'Nachrichten',
        m_login: 'Anmelden',
        m_logout: 'Abmelden',
        publish: 'Veröffentlichen',
        like: 'Gefällt mir',
        comment: 'Kommentieren',
        share: 'Teilen',
        anon: 'Anonym',
        follow: 'Folgen',
        sign_in: 'Anmelden',
        join2: 'Bei Autophagy mitmachen',
        chat_ph: 'Frag in jeder Sprache…',
        withdraw: 'Auszahlen',
        t_earnings: 'Einnahmen',
        all_f: 'Alle'
    },
    ja: {
        tagline: '何もかも、率直に語ろう',
        m_profile: 'マイプロフィール',
        m_msgs: 'メッセージ',
        m_login: 'ログイン',
        m_logout: 'ログアウト',
        publish: '投稿',
        like: 'いいね',
        comment: 'コメント',
        share: 'シェア',
        anon: '匿名',
        follow: 'フォロー',
        sign_in: 'ログイン',
        join2: 'Autophagy に参加',
        chat_ph: 'どんな言語でも質問…',
        withdraw: '引き出す',
        t_earnings: '収益',
        all_f: 'すべて'
    },
    ko: {
        tagline: '모든 것을 솔직하게 말하다',
        m_profile: '내 프로필',
        m_msgs: '메시지',
        m_login: '로그인',
        m_logout: '로그아웃',
        publish: '게시',
        like: '좋아요',
        comment: '댓글',
        share: '공유',
        anon: '익명',
        follow: '팔로우',
        sign_in: '로그인',
        join2: 'Autophagy 참여',
        chat_ph: '어떤 언어로든 물어보세요…',
        withdraw: '출금',
        t_earnings: '수익',
        all_f: '모두'
    },
    it: {
        tagline: 'Di tutto apertamente',
        m_profile: 'Il mio profilo',
        m_msgs: 'Messaggi',
        m_login: 'Accedi',
        m_logout: 'Esci',
        publish: 'Pubblica',
        like: 'Mi piace',
        comment: 'Commenta',
        share: 'Condividi',
        anon: 'Anonimo',
        follow: 'Segui',
        sign_in: 'Accedi',
        join2: 'Unisciti a Autophagy',
        chat_ph: 'Chiedi in qualsiasi lingua…',
        withdraw: 'Preleva',
        t_earnings: 'Guadagni',
        all_f: 'Tutti'
    },
    tr: {
        tagline: 'Her şeyi açıkça söyle',
        m_profile: 'Profilim',
        m_msgs: 'Mesajlar',
        m_login: 'Giriş yap',
        m_logout: 'Çıkış',
        publish: 'Gönder',
        like: 'Beğen',
        comment: 'Yorum yap',
        share: 'Paylaş',
        anon: 'Anonim',
        follow: 'Takip et',
        sign_in: 'Giriş yap',
        join2: 'Autophagy’ye katıl',
        chat_ph: 'Herhangi bir dilde sor…',
        withdraw: 'Çek',
        t_earnings: 'Kazanç',
        all_f: 'Tümü'
    },
    id: {
        tagline: 'Ucapkan segalanya terbuka',
        m_profile: 'Profil saya',
        m_msgs: 'Pesan',
        m_login: 'Masuk',
        m_logout: 'Keluar',
        publish: 'Terbitkan',
        like: 'Suka',
        comment: 'Komentar',
        share: 'Bagikan',
        anon: 'Anonim',
        follow: 'Ikuti',
        sign_in: 'Masuk',
        join2: 'Bergabung dengan Autophagy',
        chat_ph: 'Tanya dalam bahasa apa pun…',
        withdraw: 'Tarik',
        t_earnings: 'Pendapatan',
        all_f: 'Semua'
    },
    fa: {
        tagline: 'همه چیز را آشکار بگو',
        m_profile: 'پروفایل من',
        m_msgs: 'پیام‌ها',
        m_login: 'ورود',
        m_logout: 'خروج',
        publish: 'منتشر کن',
        like: 'پسند',
        comment: 'نظر',
        share: 'اشتراک',
        anon: 'ناشناس',
        follow: 'دنبال کردن',
        sign_in: 'ورود',
        join2: 'به اتوفاژی بپیوند',
        chat_ph: 'به هر زبانی بپرس…',
        withdraw: 'برداشت',
        t_earnings: 'درآمد',
        all_f: 'همه'
    },
    ur: {
        tagline: 'سب کچھ کھل کر کہو',
        m_profile: 'میری پروفائل',
        m_msgs: 'پیغامات',
        m_login: 'لاگ ان',
        m_logout: 'لاگ آؤٹ',
        publish: 'شائع کریں',
        like: 'پسند',
        comment: 'تبصرہ',
        share: 'شیئر',
        anon: 'گمنام',
        follow: 'فالو',
        sign_in: 'لاگ ان',
        join2: 'آٹوفاجی میں شامل ہوں',
        chat_ph: 'کسی بھی زبان میں پوچھیں…',
        withdraw: 'نکالیں',
        t_earnings: 'آمدنی',
        all_f: 'تمام'
    },
    uk: {
        tagline: 'Кажи все відкрито',
        m_profile: 'Мій профіль',
        m_msgs: 'Повідомлення',
        m_login: 'Увійти',
        m_logout: 'Вийти',
        publish: 'Опублікувати',
        like: 'Подобається',
        comment: 'Коментувати',
        share: 'Поділитися',
        anon: 'Анонімно',
        follow: 'Підписатися',
        sign_in: 'Увійти',
        join2: 'Приєднуйся до Autophagy',
        chat_ph: 'Питай будь-якою мовою…',
        withdraw: 'Вивести',
        t_earnings: 'Заробіток',
        all_f: 'Усі'
    },
    pl: {
        tagline: 'Mów wszystko otwarcie',
        m_profile: 'Mój profil',
        m_msgs: 'Wiadomości',
        m_login: 'Zaloguj',
        m_logout: 'Wyloguj',
        publish: 'Opublikuj',
        like: 'Lubię',
        comment: 'Skomentuj',
        share: 'Udostępnij',
        anon: 'Anonimowo',
        follow: 'Obserwuj',
        sign_in: 'Zaloguj',
        join2: 'Dołącz do Autophagy',
        chat_ph: 'Zapytaj w dowolnym języku…',
        withdraw: 'Wypłać',
        t_earnings: 'Zarobki',
        all_f: 'Wszystkie'
    },
    nl: {
        tagline: 'Zeg alles openlijk',
        m_profile: 'Mijn profiel',
        m_msgs: 'Berichten',
        m_login: 'Inloggen',
        m_logout: 'Uitloggen',
        publish: 'Publiceren',
        like: 'Vind ik leuk',
        comment: 'Reageren',
        share: 'Delen',
        anon: 'Anoniem',
        follow: 'Volgen',
        sign_in: 'Inloggen',
        join2: 'Word lid van Autophagy',
        chat_ph: 'Vraag in elke taal…',
        withdraw: 'Opnemen',
        t_earnings: 'Inkomsten',
        all_f: 'Alle'
    },
    sv: {
        tagline: 'Säg allt öppet',
        m_profile: 'Min profil',
        m_msgs: 'Meddelanden',
        m_login: 'Logga in',
        m_logout: 'Logga ut',
        publish: 'Publicera',
        like: 'Gilla',
        comment: 'Kommentera',
        share: 'Dela',
        anon: 'Anonym',
        follow: 'Följ',
        sign_in: 'Logga in',
        join2: 'Gå med i Autophagy',
        chat_ph: 'Fråga på vilket språk som helst…',
        withdraw: 'Ta ut',
        t_earnings: 'Intäkter',
        all_f: 'Alla'
    },
    vi: {
        tagline: 'Nói mọi điều thẳng thắn',
        m_profile: 'Hồ sơ của tôi',
        m_msgs: 'Tin nhắn',
        m_login: 'Đăng nhập',
        m_logout: 'Đăng xuất',
        publish: 'Đăng bài',
        like: 'Thích',
        comment: 'Bình luận',
        share: 'Chia sẻ',
        anon: 'Ẩn danh',
        follow: 'Theo dõi',
        sign_in: 'Đăng nhập',
        join2: 'Tham gia Autophagy',
        chat_ph: 'Hỏi bằng bất kỳ ngôn ngữ nào…',
        withdraw: 'Rút tiền',
        t_earnings: 'Thu nhập',
        all_f: 'Mọi'
    },
    th: {
        tagline: 'พูดทุกอย่างอย่างเปิดเผย',
        m_profile: 'โปรไฟล์ของฉัน',
        m_msgs: 'ข้อความ',
        m_login: 'เข้าสู่ระบบ',
        m_logout: 'ออกจากระบบ',
        publish: 'เผยแพร่',
        like: 'ถูกใจ',
        comment: 'ความคิดเห็น',
        share: 'แชร์',
        anon: 'ไม่ระบุชื่อ',
        follow: 'ติดตาม',
        sign_in: 'เข้าสู่ระบบ',
        join2: 'เข้าร่วม Autophagy',
        chat_ph: 'ถามเป็นภาษาใดก็ได้…',
        withdraw: 'ถอนเงิน',
        t_earnings: 'รายได้',
        all_f: 'ทั้งหมด'
    },
    sw: {
        tagline: 'Sema yote wazi',
        m_profile: 'Wasifu wangu',
        m_msgs: 'Ujumbe',
        m_login: 'Ingia',
        m_logout: 'Toka',
        publish: 'Tuma',
        like: 'Penda',
        comment: 'Toa maoni',
        share: 'Shiriki',
        anon: 'Rihi',
        follow: 'Fuata',
        sign_in: 'Ingia',
        join2: 'JIunge na Autophagy',
        chat_ph: 'Uliza kwa lugha yoyote…',
        withdraw: 'Toa',
        t_earnings: 'Mapato',
        all_f: 'Zote'
    },
};
const t = k => (D[S.lang] && D[S.lang][k]) || D.en[k] || k;

/* ================= static data ================= */
const TOPICS = {
    pain: {
        c: '#7C1D1D'
    },
    suffering: {
        c: '#55555F'
    },
    love: {
        c: '#C0195B'
    },
    story: {
        c: '#B4530A'
    },
    poem: {
        c: '#8A2C4E'
    },
    travel: {
        c: '#0E7490'
    },
    heritage: {
        c: '#5B3A82'
    },
    music: {
        c: '#0B6E4F'
    },
    books: {
        c: '#26437A'
    }
};
const TOPIC_KEYS = Object.keys(TOPICS);
const TLBL = {
    pain: 'em_pain',
    suffering: 'em_suffer',
    love: 'em_love',
    story: 't_story',
    poem: 't_poem',
    travel: 't_travel',
    heritage: 't_heritage',
    music: 't_music',
    books: 't_books'
};
const tl = k => t(TLBL[k] || k);
const EMO_C = k => (TOPICS[k] || {
    c: '#55555F'
}).c;
const AGEK = ['13-17', '18-24', '25-34', '35-44', '45+'];
const AGEW = [0.09, 0.31, 0.29, 0.19, 0.12];
const CTRY = {
    US: 'United States',
    GB: 'United Kingdom',
    IN: 'India',
    BD: 'Bangladesh',
    BR: 'Brazil',
    NG: 'Nigeria',
    DE: 'Germany',
    JP: 'Japan',
    FR: 'France',
    ID: 'Indonesia',
    MX: 'Mexico',
    PH: 'Philippines',
    EG: 'Egypt',
    TR: 'Türkiye',
    RU: 'Russia',
    CN: 'China',
    ES: 'Spain',
    IT: 'Italy',
    PK: 'Pakistan',
    CA: 'Canada',
    AU: 'Australia',
    ZA: 'South Africa',
    KR: 'South Korea',
    VN: 'Vietnam',
    AR: 'Argentina',
    CO: 'Colombia',
    TH: 'Thailand',
    SA: 'Saudi Arabia',
    KW: 'Kuwait',
    AE: 'UAE',
    UA: 'Ukraine',
    PL: 'Poland',
    RO: 'Romania',
    KE: 'Kenya'
};
const CURR = {
    US: ['USD', '$', 1],
    GB: ['GBP', '£', 0.79],
    IN: ['INR', '₹', 84],
    BD: ['BDT', '৳', 122],
    BR: ['BRL', 'R$', 5.7],
    NG: ['NGN', '₦', 1580],
    DE: ['EUR', '€', 0.92],
    JP: ['JPY', '¥', 152],
    FR: ['EUR', '€', 0.92],
    ID: ['IDR', 'Rp', 15800],
    MX: ['MXN', '$', 18],
    PH: ['PHP', '₱', 58],
    EG: ['EGP', 'E£', 48],
    TR: ['TRY', '₺', 34],
    RU: ['RUB', '₽', 92],
    CN: ['CNY', '¥', 7.2],
    ES: ['EUR', '€', 0.92],
    IT: ['EUR', '€', 0.92],
    PK: ['PKR', '₨', 278],
    CA: ['CAD', 'C$', 1.37],
    AU: ['AUD', 'A$', 1.5],
    ZA: ['ZAR', 'R', 18],
    KR: ['KRW', '₩', 1370],
    VN: ['VND', '₫', 25000],
    AR: ['ARS', '$', 950],
    CO: ['COP', '$', 4100],
    TH: ['THB', '฿', 35],
    SA: ['SAR', '﷼', 3.75],
    KW: ['KWD', 'د.ك', 0.31],
    AE: ['AED', 'د.إ', 3.67],
    UA: ['UAH', '₴', 41],
    PL: ['PLN', 'zł', 4],
    RO: ['RON', 'lei', 4.6],
    KE: ['KES', 'KSh', 130]
};
const curFor = c => CURR[c] || CURR.US;
const locMoney = (n, ct) => {
    const [sym,code,rate] = curFor(ct);
    return sym + (n * rate).toLocaleString(undefined, {
        maximumFractionDigits: 0
    }) + ' ' + code
}
;
const HUES = ['#26437A', '#7C1D1D', '#0B6E4F', '#5B3A82', '#B4530A', '#0E7490', '#8A2C4E', '#3D5A26'];
const PEOPLE = [{
    id: 'p_amara',
    name: 'Amara Okafor',
    ct: 'NG',
    bio: 'Lagos. Survivor, singer, still here.',
    fl: 5310,
    lines: ['Thank you for the surge — I felt it all the way in Lagos.', 'Your honesty gives other people permission. Keep going.']
}, {
    id: 'p_mehrab',
    name: 'Mehrab Hossain',
    ct: 'BD',
    bio: 'Dhaka. Rain writes better than I do.',
    fl: 3208,
    lines: ['ঢাকা থেকে: বৃষ্টি এখনো থামেনি। (Rain still hasn’t stopped here.)', 'Your words on the feed — they stayed with me all evening.']
}, {
    id: 'p_yuki',
    name: 'Yuki Tanaka',
    ct: 'JP',
    bio: 'Kyoto. I write to the people who left.',
    fl: 2412,
    lines: ['同窓会の話、読んでくれてありがとう。', 'I read everything three times before replying.']
}, {
    id: 'p_ken',
    name: 'Kim Ha-eun',
    ct: 'KR',
    bio: 'Seoul. Night-shift nurse.',
    fl: 4455,
    lines: ['Night shift again. Your words keep me company at 3am.', '솔직해서 고마워요. (Thank you for being honest.)']
}, {
    id: 'p_rafa',
    name: 'Rafael Costa',
    ct: 'BR',
    bio: 'São Paulo. Saudade is a language.',
    fl: 1877,
    lines: ['A saudade não traduz, mas conecta.', 'Obrigado pela onda — senti daqui.']
}, {
    id: 'p_lena',
    name: 'Lena Hoffmann',
    ct: 'DE',
    bio: 'Leipzig. Grief, out loud.',
    fl: 934,
    lines: ['Danke für die Welle. Ich lese langsam, aber ich lese alles.', 'Manche Sätze brauchen Monate. Deine waren es wert.']
}, {
    id: 'p_omar',
    name: 'Omar El-Sayed',
    ct: 'EG',
    bio: 'Cairo. Streets taught me poetry.',
    fl: 2043,
    lines: ['من القاهرة: موجتك وصلت.', 'الشعر في الشارع قبل الكتب.']
}, {
    id: 'p_lin',
    name: 'Lin Wei',
    ct: 'CN',
    bio: 'Chengdu. Quiet dots, loud heart.',
    fl: 1567,
    lines: ['谢谢你读我的帖子。', '安静的人也有很响的心跳。']
}, ];
const person = id => PEOPLE.find(p => p.id === id);
const GROUPS = [{
    id: 'g1',
    name: 'Healing Hearts',
    ic: '💔',
    topic: 'pain',
    m: 21300
}, {
    id: 'g2',
    name: 'Poetry Corner',
    ic: '🖋️',
    topic: 'poem',
    m: 12400
}, {
    id: 'g3',
    name: 'Wanderlust Diaries',
    ic: '🧭',
    topic: 'travel',
    m: 8800
}, {
    id: 'g4',
    name: 'Music Room',
    ic: '🎵',
    topic: 'music',
    m: 15900
}, {
    id: 'g5',
    name: 'Book Club',
    ic: '📚',
    topic: 'books',
    m: 6700
}, {
    id: 'g6',
    name: 'Old & Golden',
    ic: '🏛️',
    topic: 'heritage',
    m: 4300
}];
const gwFor = c => ({
    BD: ['bKash', 'Nagad', 'Rocket', 'Bank transfer'],
    IN: ['UPI', 'Paytm', 'Bank transfer'],
    PK: ['JazzCash', 'Easypaisa', 'Bank transfer'],
    NG: ['Opay', 'Paystack', 'Bank transfer'],
    BR: ['Pix', 'Bank transfer'],
    US: ['PayPal', 'Stripe', 'Bank (ACH)'],
    GB: ['PayPal', 'Wise', 'Bank transfer'],
    EG: ['Vodafone Cash', 'Bank transfer'],
    ID: ['GoPay', 'OVO', 'Bank transfer'],
    PH: ['GCash', 'Maya', 'Bank transfer'],
    VN: ['MoMo', 'Bank transfer']
}[c] || ['PayPal', 'Wise', 'Bank transfer']);
const COVERS = ['linear-gradient(120deg,#0000AD 0%,#1B1BCF 45%,#6A1FB8 80%,#C0195B 100%)', 'linear-gradient(120deg,#0B0B16 0%,#26265F 55%,#0000AD 100%)', 'radial-gradient(130% 170% at 15% 10%,#0B6E4F 0%,#0E7490 45%,#0B1B4A 100%)', 'linear-gradient(120deg,#7C1D1D 0%,#B4530A 55%,#E0A43C 100%)', 'radial-gradient(130% 160% at 80% 15%,#C0195B 0%,#5B3A82 55%,#0B0B16 100%)', 'linear-gradient(160deg,#0E7490 0%,#0000AD 70%)', 'radial-gradient(110% 150% at 50% 0%,#2E2E6E 0%,#0B0B16 75%)', 'linear-gradient(135deg,#3D5A26 0%,#0B6E4F 50%,#0000AD 100%)'];
const AD_STYLES = {
    Video: 'linear-gradient(120deg,#0E7490,#0000AD)',
    Banner: 'linear-gradient(120deg,#C0195B,#5B3A82)',
    Placard: 'linear-gradient(120deg,#B4530A,#E0A43C)',
    Photocard: 'linear-gradient(120deg,#0B6E4F,#0E7490)',
    Animation: 'linear-gradient(120deg,#7C1D1D,#C0195B,#0000AD,#0E7490);background-size:300% 100%;animation:adanim 6s linear infinite'
};
const AD_DURS = [{
    d: 3,
    k: 'dur_3',
    price: 15
}, {
    d: 10,
    k: 'dur_10',
    price: 45
}, {
    d: 30,
    k: 'dur_30',
    price: 110
}, {
    d: 90,
    k: 'dur_90',
    price: 300
}, {
    d: 180,
    k: 'dur_180',
    price: 550
}, {
    d: 365,
    k: 'dur_365',
    price: 900
}];
const PLACES = [{
    v: 'feed',
    k: 'pl_feed',
    m: 1,
    mk: 'mult_feed'
}, {
    v: 'header',
    k: 'pl_header',
    m: 1.2,
    mk: 'mult_mid'
}, {
    v: 'footer',
    k: 'pl_footer',
    m: 1.2,
    mk: 'mult_mid'
}, {
    v: 'pop',
    k: 'pl_pop',
    m: 1.5,
    mk: 'mult_pop'
}];
const placeOf = a => a.place || 'feed';
const placeInfo = a => PLACES.find(p => p.v === placeOf(a)) || PLACES[0];
const adPrice = (du, pl) => Math.round(du.price * pl.m * 100) / 100;
const AD_EXP = a => a.expiresAt && a.expiresAt < Date.now();
const liveAds = () => (S.ads || []).filter(a => a.status === 'live' && !AD_EXP(a));
const AD_NETS = {
    adsterra: {
        name: 'Adsterra',
        ic: '🟠',
        c: '#FF6B35',
        desc: 'CPM/CPA — Pop, Banner, Social Bar, Direct Link'
    },
    monetag: {
        name: 'Monetag',
        ic: '💎',
        c: '#00C9A7',
        desc: 'Push, Pop, Interstitial, Banner, Direct Link'
    },
    terrabox: {
        name: 'TerraBox',
        ic: '📦',
        c: '#8B5CF6',
        desc: 'File hosting + ad revenue sharing'
    },
    adsense: {
        name: 'Google AdSense',
        ic: '📊',
        c: '#4285F4',
        desc: 'Display ads on your content — earn per impression'
    },
    gadlink: {
        name: 'Google Ad Link',
        ic: '🔗',
        c: '#34A853',
        desc: 'Direct ad link — earn per click'
    }
};
const AD_NET_KEYS = Object.keys(AD_NETS);
const DEF_BANK = {
    acc: '01345981024',
    name: 'Pubali Bank · Dhaka 1200',
    holder: 'Account holder name: confidential 🔒',
    bkash: '+8801722616040',
    nagad: '+8801722616040',
    rocket: '+8801722616040'
};
const DEF_ABOUT = {
    name: 'Mr. Tapas Chandra Das',
    img: null,
    text: 'Autophagy-এর প্রতিষ্ঠাতা — সবার জন্য খোলা কথার প্ল্যাটফর্ম, যেখানে প্রতিটি দেশের মানুষ নিজের ভাষায় মনের কথা বলে ও আয় করে।'
};
const LOGO_DICE = `<svg viewBox="0 0 192 64" xmlns="http://www.w3.org/2000/svg"><rect width="192" height="64" rx="8" fill="#14b8b3"/>${'AUTOPHAGY'.split('').map( (ch, i) => `<rect x="${5 + i * 20.5}" y="11" width="17" height="17" rx="3.5" fill="#fdfdf6"/><text x="${13.5 + i * 20.5}" y="24" font-size="10" font-weight="800" text-anchor="middle" fill="#1d1d1f" font-family="Arial">${ch}</text><rect x="${5 + i * 20.5}" y="35" width="17" height="17" rx="3.5" fill="#fdfdf6"/><text x="${13.5 + i * 20.5}" y="48" font-size="10" font-weight="800" text-anchor="middle" fill="#1d1d1f" font-family="Arial">${ch}</text>`).join('')}</svg>`;
const BAD_RE = /(porn\w*|xxx|nudes?\b|onlyfans|18\+|escort\b|sexy\s?(video|girl|site)|অশ্লীল|পর্ন|अश्लील|पोर्न|إباحي|色情|裸聊|beheading|murder\s?video|rivers? of blood|gore\b|রক্তাক্ত|হত্যার\s?দৃশ্য|খূনী|खूनी|دَمَوي)/i;
const BAD_DOM = /(porn|xxx|onlyfans|escort|nsfw|18plus|bet\b|casino)/i;
const linkBad = txt => ((txt.match(/https?:\/\/[^\s]+/gi) || []).some(u => BAD_DOM.test(u)));

/* ================= state ================= */
let S = null
  , view = 'feed'
  , viewState = {
    ptab: 'posts',
    q: '',
    pid: null,
    pv: 'posts',
    gid: null
}
  , activeEmo = null
  , activeTag = null
  , activeGroup = null;
const openC = new Set()
  , replyTo = new Set();
let draftText = ''
  , draftMedia = []
  , draftEmo = null
  , draftAnon = false
  , avoOpen = false
  , avoSeeded = false
  , curThread = null
  , typing = false
  , heroTimers = []
  , tfaTimer = null
  , adTemp = null
  , adMediaData = null
  , adPayShot = null
  , wdShotD = null
  , adSlideIdx = 0
  , adSliderTimer = null
  , popTimer = null
  , popIdx = 0
  , azImgData = null
  , pinOk = false
  , stripIdx = {
    header: 0,
    footer: 0
}
  , abImgData = null;

function makeWav() {
    const sr = 8000
      , d = 2.6
      , N = sr * d
      , data = new Int16Array(N);
    for (let i = 0; i < N; i++) {
        const x = i / sr;
        const env = Math.min(1, x * 3) * Math.min(1, (d - x) * 2) * (0.65 + 0.35 * Math.sin(2 * Math.PI * 0.5 * x));
        const v = 0.5 * Math.sin(2 * Math.PI * 146 * x) + 0.26 * Math.sin(2 * Math.PI * 220 * x + Math.sin(2 * Math.PI * 5.2 * x)) + 0.1 * Math.sin(2 * Math.PI * 311 * x);
        data[i] = Math.max(-1, Math.min(1, v * env * 0.55)) * 32767
    }
    const buf = new ArrayBuffer(44 + N * 2)
      , w = new DataView(buf);
    const ws = (o, s) => {
        for (let i = 0; i < s.length; i++)
            w.setUint8(o + i, s.charCodeAt(i))
    }
    ;
    ws(0, 'RIFF');
    w.setUint32(4, 36 + N * 2, true);
    ws(8, 'WAVEfmt ');
    w.setUint32(16, 16, true);
    w.setUint16(20, 1, true);
    w.setUint16(22, 1, true);
    w.setUint32(24, sr, true);
    w.setUint32(28, sr * 2, true);
    w.setUint16(32, 2, true);
    w.setUint16(34, 16, true);
    ws(36, 'data');
    w.setUint32(40, N * 2, true);
    new Int16Array(buf,44).set(data);
    return URL.createObjectURL(new Blob([buf],{
        type: 'audio/wav'
    }));
}
function seedPosts() {
    const now = Date.now()
      , H = 36e5;
    const reads = id => {
        const r = mulberry(hashStr(id));
        const total = Math.round(400 + r() * 3800);
        const keys = Object.keys(CTRY);
        const k = 9 + Math.floor(r() * 6);
        const by = {};
        let left = total;
        for (let i = 0; i < k; i++) {
            const c = keys[Math.floor(r() * keys.length)];
            const v = i === k - 1 ? left : Math.round(total * (0.03 + r() * 0.16));
            by[c] = (by[c] || 0) + v;
            left -= v;
            if (left <= 0)
                break
        }
        by.US = (by.US || 0) + Math.max(0, left);
        const byAge = {};
        let la = total;
        AGEK.forEach( (a, i) => {
            byAge[a] = i === AGEK.length - 1 ? Math.max(0, la) : Math.round(total * AGEW[i] * (0.85 + r() * 0.3));
            la -= byAge[a]
        }
        );
        return {
            total,
            by,
            byAge
        }
    }
    ;
    const P = (id, author, anon, topic, text, media, ts, likes, shares, comments) => ({
        id,
        author,
        anon,
        emotion: topic,
        text,
        media,
        ts,
        likes: likes || [],
        shares: shares || 0,
        comments: comments || [],
        reads: reads(id)
    });
    return [P('s1', 'p_amara', false, 'hope', "Six months ago I couldn't say the word “future” out loud. Tonight I sang it.\n\nI recorded this hum the morning I finally slept — keep it, it's yours too. #hope", [{
        type: 'audio',
        url: '',
        gen: 'wav',
        label: 'voice note'
    }], now - 5 * H, ['p_ken', 'p_yuki', 'p_rafa', 'p_mehrab'], 184, [{
        id: 'c1',
        by: 'p_ken',
        anon: false,
        text: 'This is the bravest thing I read all year. From a Seoul night shift: thank you.',
        ts: now - 4 * H,
        replies: [{
            id: 'r1',
            by: 'p_amara',
            anon: false,
            text: 'Ha-eun, you hold people alive every night. This is for you too.',
            ts: now - 3.4 * H
        }]
    }, {
        id: 'c2',
        by: null,
        anon: true,
        text: 'I needed this tonight more than you know.',
        ts: now - 3 * H,
        replies: []
    }]), P('s2', 'p_yuki', false, 'love', "同窓会で、あなたの名前を呼べなかった。\n二十年経っても、声が覚えていた。\n\n(At the reunion, I couldn’t say your name. After twenty years, my voice still remembered.)", [{
        type: 'image',
        url: 'https://picsum.photos/seed/kyoto-rain/900/560.jpg'
    }], now - 9 * H, ['p_amara'], 92, [{
        id: 'c4',
        by: null,
        anon: true,
        text: 'Alcune parole restano per sempre sulla punta della lingua.',
        ts: now - 8 * H,
        replies: []
    }]), P('s3', 'p_mehrab', false, 'pain', "ঢাকার বৃষ্টিতে একা ভিজতে ভালো লাগে —\nকেউ জিজ্ঞেস করে না কেন ভিজছি।\n\n(I like getting soaked alone in Dhaka’s rain — nobody asks why I’m wet.)", [], now - 14 * H, ['p_yuki'], 143, []), P('s4', 'p_lena', false, 'books', "„Der Vorleser“ wieder gelesen — diesmal weinte ich auf Seite 87.\nBooks remember who we were when we first read them. #books", [], now - 18 * H, ['p_amara', 'p_yuki'], 71, []), P('s5', null, true, 'suffering', "I smile in every group photo.\nNobody knows I rehearsed it in the bathroom first.\n\nSaying it here because nowhere else lets me.", [], now - 26 * H, ['p_ken'], 219, [{
        id: 'c6',
        by: null,
        anon: true,
        text: 'Same. But today, at least two of us know.',
        ts: now - 24 * H,
        replies: []
    }]), P('s6', 'p_rafa', false, 'travel', "Pelourinho, Salvador: o passado dança na frente de você.\n\n(History doesn't sit in museums here — it dances.)", [{
        type: 'image',
        url: 'https://picsum.photos/seed/salvador-street/900/560.jpg'
    }], now - 31 * H, ['p_yuki'], 88, []), P('s7', 'p_ken', false, 'hope', "새벽 3시 병원 복도의 불빛이 제일 다정했다.\n누군가를 지켜냈으니까.\n\n(The 3am hospital corridor light is the kindest — because someone made it through.)", [], now - 47 * H, ['p_yuki'], 168, []), P('s8', 'p_omar', false, 'poem', "القاهرة تكتبني، وأنا أكتب القاهرة.\n( Cairo writes me, and I write Cairo back. ) #poem", [], now - 52 * H, ['p_mehrab', 'p_lin'], 98, []), P('s9', 'p_lin', false, 'music', "外婆的老唱片又转起来了。\n(Grandma's old record is spinning again.)", [{
        type: 'audio',
        url: '',
        gen: 'wav'
    }], now - 60 * H, ['p_amara'], 54, []), P('m1', 'me', false, 'hope', "Starting again in a new language, on a page that doesn't flinch.\nIf this place can hold my worst days and my best ones, I'll keep writing here. #beginagain", [], now - 3 * H, ['p_amara'], 0, []), P('m2', 'me', false, 'love', "The sea doesn't ask who you were yesterday.", [{
        type: 'image',
        url: 'https://picsum.photos/seed/open-shore/900/540.jpg'
    }], now - 28 * H, [], 0, []), ];
}
function seedAdLinks() {
    const r = mulberry(hashStr('azseed'));
    return [{
        id: 'al1',
        by: 'p_amara',
        net: 'adsterra',
        url: 'https://adsterra.com/publisher/',
        title: 'Adsterra Publisher Program',
        clicks: Math.round(300 + r() * 900),
        ts: Date.now() - 72 * 36e5
    }, {
        id: 'al2',
        by: 'p_mehrab',
        net: 'monetag',
        url: 'https://monetag.com/',
        title: 'Monetag — Direct Link',
        clicks: Math.round(200 + r() * 600),
        ts: Date.now() - 48 * 36e5
    }, {
        id: 'al3',
        by: 'p_yuki',
        net: 'adsense',
        url: 'https://adsense.google.com/',
        title: 'Google AdSense',
        clicks: Math.round(100 + r() * 400),
        ts: Date.now() - 30 * 36e5
    }, {
        id: 'al4',
        by: 'p_ken',
        net: 'terrabox',
        url: 'https://terabox.com/',
        title: 'TerraBox Sharing',
        clicks: Math.round(80 + r() * 300),
        ts: Date.now() - 20 * 36e5
    }, {
        id: 'al5',
        by: 'p_rafa',
        net: 'gadlink',
        url: 'https://ads.google.com/',
        title: 'Google Ad Link',
        clicks: Math.round(50 + r() * 200),
        ts: Date.now() - 10 * 36e5
    }, ];
}
function freshState() {
    return {
        lang: pickLang(),
        adLinks: seedAdLinks(),
        azComm: 0,
        azWds: [],
        bank: {
            ...DEF_BANK
        },
        about: {
            ...DEF_ABOUT
        },
        ugroups: [],
        logo: null,
        user: null,
        acct: null,
        posts: seedPosts(),
        follows: [],
        back: {},
        myGroups: [],
        ads: [],
        adRev: 0,
        threads: {
            p_mehrab: {
                u: 1,
                log: [{
                    f: 'p',
                    text: 'Welcome to Autophagy. Your first honest post is worth more than a thousand careful ones.',
                    ts: Date.now() - 48 * 36e5
                }]
            },
            p_ken: {
                u: 1,
                log: [{
                    f: 'p',
                    text: 'Night shift keeps me here till 4am — say hello anytime.',
                    ts: Date.now() - 30 * 36e5
                }]
            }
        },
        wds: [],
        withdrawn: 0,
        notified: false,
        notifs: [],
        bookmarks: [],
        dark: false,
        remote: []
    }
}
function pickLang() {
    const n = (navigator.language || 'en').slice(0, 2);
    return LANGS.some(l => l[0] === n) ? n : 'en'
}
function save() {
    try {
        localStorage.setItem('autophagy_v2', JSON.stringify(S))
    } catch (e) {
        S.posts.forEach(p => p.media = p.media.filter(m => !m.sess));
        (S.ads || []).forEach(a => {
            if (a.media && a.media.sess)
                a.media = null
        }
        );
        try {
            localStorage.setItem('autophagy_v2', JSON.stringify(S))
        } catch (e2) {}
        toast(t('large_file'), 'alert')
    }
}
function load() {
    try {
        const raw = localStorage.getItem('autophagy_v2');
        S = raw ? JSON.parse(raw) : freshState()
    } catch (e) {
        S = freshState()
    }
    S.adLinks = S.adLinks || seedAdLinks();
    S.azComm = S.azComm || 0;
    S.azWds = S.azWds || [];
    S.bank = Object.assign({}, DEF_BANK, S.bank || {});
    S.about = Object.assign({}, DEF_ABOUT, S.about || {});
    S.ugroups = S.ugroups || [];
    S.notifs = S.notifs || [];
    S.bookmarks = S.bookmarks || [];
    S.remote = S.remote || [];
    S.follows = S.follows || [];
    S.threads = S.threads || {};
    S.wds = S.wds || [];
    S.myGroups = S.myGroups || [];
    S.ads = S.ads || [];
    S.adRev = S.adRev || 0;
    (S.ads || []).forEach(a => {
        if (a.status === 'live' && AD_EXP(a))
            a.status = 'expired'
    }
    );
    S.posts.forEach(p => {
        p.likes = p.likes || [];
        p.comments = p.comments || [];
        p.shares = p.shares || 0;
        p.reads = p.reads || {
            total: 0,
            by: {},
            byAge: {}
        };
        p.media && p.media.forEach(m => {
            if (m.gen === 'wav')
                m.url = makeWav()
        }
        )
    }
    );
    if (!S.posts.length)
        S = freshState();
}
const me = () => S.user;
const earnOf = p => {
    const g = p.reads.total * 0.011 + (p.likes?.length || 0) * 0.02 + (p.shares || 0) * 0.05;
    return {
        g,
        f: g * 0.2,
        n: g * 0.8
    }
}
;
const myPosts = () => S.posts.filter(p => p.author === 'me');
const avail = () => Math.max(0, myPosts().reduce( (s, p) => s + earnOf(p).n, 0) - (S.withdrawn || 0));
const linkEarn = l => (l.clicks || 0) * AZ_EST_CPC * (1 - AZ_COMM_RATE);
const linkComm = l => (l.clicks || 0) * AZ_EST_CPC * AZ_COMM_RATE;
const myLinks = () => (S.adLinks || []).filter(l => l.by === 'me');
const myAzEarn = () => myLinks().reduce( (s, l) => s + linkEarn(l), 0);
const myAzClicks = () => myLinks().reduce( (s, l) => s + (l.clicks || 0), 0);
const myAzWd = () => (S.azWds || []).filter(w => w.by === 'me').reduce( (s, w) => s + w.amt, 0);
const azPool = () => (S.adLinks || []).reduce( (s, l) => s + linkComm(l), 0);

/* ================= security helpers ================= */
let loginFails = 0
  , lockUntil = 0;
const isLocked = () => Date.now() < lockUntil;
function failLogin() {
    loginFails++;
    if (loginFails >= 5) {
        lockUntil = Date.now() + 2 * 60 * 1000;
        loginFails = 0;
        toast(t('err_lock'), 'lock')
    } else
        toast(t('err_creds'), 'alert')
}
function resetFail() {
    loginFails = 0;
    lockUntil = 0
}
const SESSION_MS = 12 * 60 * 60 * 1000;
function touchSession() {
    if (me()) {
        S.sessAt = Date.now();
        save()
    }
}
function checkSession() {
    if (me() && S.sessAt && Date.now() - S.sessAt > SESSION_MS) {
        S.user = null;
        save();
        renderHeader();
        go('feed');
        toast(t('err_sess'), 'lock');
        return false
    }
    if (me())
        touchSession();
    return true;
}
setInterval(checkSession, 60 * 1000);

/* ================= toast / modal ================= */
function toast(msg, icn='check') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = ic(icn) + `<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout( () => {
        el.style.opacity = '0';
        el.style.transition = '.3s';
        setTimeout( () => el.remove(), 320)
    }
    , 3400)
}
function modal(html) {
    $('#mcard').innerHTML = `<button class="mclose" data-act="closeModal">${ic('x')}</button>` + html;
    $('#modal').classList.add('open')
}
function closeModal() {
    $('#modal').classList.remove('open');
    if (tfaTimer) {
        clearInterval(tfaTimer);
        tfaTimer = null
    }
}
function confirmModal(title, body, yesLabel, fn) {
    modal(`<h3>${esc(title)}</h3><p class="sub">${esc(body)}</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn ghost" data-act="closeModal">${t('cancel')}</button><button class="btn" id="cfYes" style="background:#8A2A2A">${esc(yesLabel)}</button></div>`);
    $('#cfYes').onclick = () => {
        closeModal();
        fn()
    }
}

/* ================= avatar / audio ================= */
function avatarHTML(name, hue, size, photo, anon) {
    const s = size || 36;
    if (anon)
        return `<span class="av av-anon" style="width:${s}px;height:${s}px;font-size:${s * .42}px">?</span>`;
    if (photo)
        return `<span class="av" style="width:${s}px;height:${s}px"><img src="${photo}" alt=""></span>`;
    const ch = (name || '?').trim()[0] || '?';
    return `<span class="av" style="width:${s}px;height:${s}px;font-size:${s * .42}px;background:${hue || '#0000AD'}">${esc(ch.toUpperCase())}</span>`;
}
function audioHTML(url) {
    const id = uid();
    setTimeout( () => {
        const w = document.getElementById(id);
        if (!w)
            return;
        const a = new Audio(url);
        const f = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
        a.addEventListener('loadedmetadata', () => {
            w.querySelector('.aptime').textContent = f(a.duration)
        }
        );
        w.querySelector('.apb').onclick = () => {
            if (a.paused) {
                document.querySelectorAll('audio').forEach(x => x.pause());
                a.play()
            } else
                a.pause()
        }
        ;
        a.onplay = () => w.querySelector('.apb').innerHTML = ic('pause');
        a.onpause = () => w.querySelector('.apb').innerHTML = ic('play');
        a.ontimeupdate = () => {
            w.querySelector('.apfill').style.width = (a.currentTime / (a.duration || 1) * 100) + '%';
            w.querySelector('.aptime').textContent = f(a.currentTime)
        }
        ;
        w.querySelector('.aptrack').onclick = e => {
            const r = e.currentTarget.getBoundingClientRect();
            a.currentTime = ((e.clientX - r.left) / r.width) * (a.duration || 0)
        }
        ;
    }
    , 0);
    return `<span class="aplayer" id="${id}"><button class="apb" type="button">${ic('play')}</button><span class="aptrack"><span class="apfill"></span></span><span class="aptime mono">voice note</span></span>`;
}

/* ================= header / nav ================= */
function renderHeader() {
    const u = me();
    $('#logoBox').innerHTML = S.logo ? `<img src="${S.logo}" alt="logo">` : LOGO_DICE;
    $('#btnMyProfile').innerHTML = ic('user') + `<span>${esc(t('m_profile'))}</span>`;
    const gtc = gtActive();
    $('#langBtn').innerHTML = ic('globe') + `<span class="mono">${gtc && gtc !== S.lang ? gtc.toUpperCase() + '·GT' : S.lang.toUpperCase()}</span>`;
    const fab = $('#avoFab');
    if (fab)
        fab.innerHTML = ic('bot');
    const xc = $('#avo .avo-h button[data-act="avoClose"]');
    if (xc)
        xc.innerHTML = ic('x');
    const sb = $('#avoForm .c-send');
    if (sb)
        sb.innerHTML = ic('send', 'width:15px;height:15px');
    const bb = $('#bellBtn')
      , db = $('#darkBtn');
    if (bb) {
        const un = (S.notifs || []).filter(n => !n.read).length;
        bb.innerHTML = ic('bell') + (un ? `<span class="bdot">${un > 9 ? '9+' : un}</span>` : '')
    }
    if (db)
        db.innerHTML = ic(S.dark ? 'sun' : 'moon');
    $('#authZone').innerHTML = u ? `<button class="tbtn" data-act="nav_profile" style="padding:4px 10px 4px 4px">${avatarHTML(u.name, u.color, 28, u.photo)}<span style="font-size:13.5px">${esc(u.name.split(' ')[0])}</span></button>` : `<button class="tbtn" data-act="m_login">${esc(t('m_login'))}</button><button class="tbtn pri" data-act="m_join">${esc(t('m_join'))}</button>`;
    const unread = Object.values(S.threads || {}).reduce( (s, x) => s + (x.u || 0), 0);
    const items = [['feed', 'feather', () => go('feed')], ['profile', 'user', () => requireAuth('profile')], ['saved', 'bookmark', () => go('saved')], ['adzone', 'wallet', () => go('adzone')], ['msgs', 'cmt', () => requireAuth('msgs')], ['earn', 'wallet', () => requireAuth('earn')], ['sec', 'shield', () => requireAuth('sec')]];
    $('#rail').innerHTML = items.map( ([k,icn], i) => {
        const on = view === k || (k === 'earn' && view === 'profile' && viewState.ptab === 'earnings') || (k === 'sec' && view === 'profile' && viewState.ptab === 'security');
        const lbl = t(k === 'feed' ? 'all_f' : k === 'profile' ? 'm_profile' : k === 'saved' ? 't_saved' : k === 'adzone' ? 'az_t' : k === 'msgs' ? 'm_msgs' : k === 'earn' ? 't_earnings' : 't_security');
        return `<button class="rl ${on ? 'on' : ''}" data-act="rail" data-i="${i}">${ic(icn)}<span>${esc(lbl)}</span>${k === 'msgs' && unread ? `<span class="nbadge">${unread}</span>` : ''}</button>`
    }
    ).join('') + `<span class="rl-sp"></span><div class="rl-foot">ENCRYPTED · SHA-256<br>2FA · SECURE SESSION<br>24 LANG + GT · v4.1</div>`;
    $('#mobilebar').innerHTML = items.slice(0, 5).map( ([k,icn], i) => {
        const on = view === k;
        return `<button class="${on ? 'on' : ''}" data-act="rail" data-i="${i}">${ic(icn, 'width:21px;height:21px')}${k === 'msgs' && unread ? '<span class="nbadge">' + unread + '</span>' : ''}</button>`
    }
    ).join('');
    renderStrips();
}
function requireAuth(which) {
    if (!me())
        return openAuth('login');
    if (which === 'earn') {
        view = 'profile';
        viewState.ptab = 'earnings'
    } else if (which === 'sec') {
        view = 'profile';
        viewState.ptab = 'security'
    } else
        view = which;
    renderView();
}
function renderMenu() {
    const u = me();
    const pendN = (S.ads || []).filter(a => a.status === 'pending').length;
    $('#menuPanel').innerHTML = `<div class="mono" style="font-size:10px;color:var(--mut);padding:8px 13px 5px;letter-spacing:.08em">AUTOPHAGY<em style="color:var(--blue);font-style:normal">.</em> MENU</div>
   ${u ? `<button class="mitem" data-act="nav_profile">${ic('edit')}${esc(t('m_profile'))}</button>` : `<button class="mitem" data-act="m_login">${ic('lock')}${esc(t('m_login'))}</button>`}
   <button class="mitem" data-act="friendSearch">${ic('search')}${esc(t('fs_t'))}</button>
   <button class="mitem" data-act="gCreateOpen">👥 ${esc(t('g_create'))}</button>
   <button class="mitem" data-act="nav_adzone">💰 ${esc(t('az_t'))}</button>
   <button class="mitem" data-act="openAds">📢 ${esc(t('advertise'))}</button>
   <button class="mitem" data-act="adAdmin">✅ ${esc(t('ad_admin_t'))}${pendN ? `<span class="nbadge" style="margin-inline-start:auto">${pendN}</span>` : ''}</button>
   <button class="mitem" data-act="logoUp">${ic('img')}${esc(t('logo_chg'))}</button>
   <div class="msep"></div>
   ${u ? `<button class="mitem" data-act="m_logout">${ic('out')}${esc(t('m_logout'))}</button>` : `<button class="mitem" data-act="m_join">${ic('zap')}${esc(t('m_join'))}</button>`}`;
}
function toggleMenu(force) {
    renderMenu();
    const p = $('#menuPanel');
    p.classList.toggle('open', force !== undefined ? force : !p.classList.contains('open'))
}

/* ================= header search ================= */
function tsRender(v) {
    const box = $('#tsRes');
    if (!box)
        return;
    if (!v || !v.trim()) {
        box.classList.remove('open');
        return
    }
    const q = v.toLowerCase();
    const ps = PEOPLE.filter(p => p.name.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q)).slice(0, 4);
    const gs = GROUPS.filter(g => g.name.toLowerCase().includes(q)).slice(0, 3);
    const ug = (S.ugroups || []).filter(g => g.name.toLowerCase().includes(q)).slice(0, 3);
    const os = S.posts.filter(p => p.text && p.text.toLowerCase().includes(q)).slice(0, 3);
    box.innerHTML = [...ps.map(p => `<button class="tsi" data-act="viewPerson" data-u="${p.id}">${avatarHTML(p.name, HUES[PEOPLE.indexOf(p) % HUES.length], 30)}<b>${esc(p.name)}</b><span class="mono" style="color:var(--mut);font-size:11px">${esc(p.ct)}</span><span class="tsa">${esc(t('view_prof'))}</span></button>`), ...gs.map(g => `<button class="tsi" data-act="tsJoin" data-g="${g.id}"><span style="font-size:17px">${g.ic}</span><b>${esc(g.name)}</b><span class="tsa">${S.myGroups.includes(g.id) ? esc(t('joined')) : esc(t('join'))}</span></button>`), ...ug.map(g => `<button class="tsi" data-act="openUG" data-id="${g.id}"><span style="font-size:17px">👥</span><b>${esc(g.name)}</b><span class="tsa">${esc(t('open'))}</span></button>`), ...os.map(p => `<button class="tsi" data-act="openP" data-id="${p.id}"><span style="font-size:15px">✍️</span><b>${esc(p.text.slice(0, 44))}</b><span class="tsa">${esc(t('open'))}</span></button>`)].join('') || `<p class="tsi" style="color:var(--mut);cursor:default">${esc(t('no_res'))}</p>`;
    box.classList.add('open');
}
function fsModal() {
    modal(`<h3>${ic('search')} ${esc(t('fs_t'))}</h3><p class="sub">${esc(t('search_ph2'))}</p>
   <div class="field"><input id="fsIn" autocomplete="off" placeholder="${esc(t('search_ph2'))}"></div><div id="fsRes"></div>
   <div class="msep"></div><button class="btn ghost sm" style="width:100%;justify-content:center" data-act="gCreateOpen">👥 + ${esc(t('g_create'))}</button>`);
    const r = v => {
        const q = (v || '').toLowerCase();
        const box = $('#fsRes');
        if (!box)
            return;
        const ps = PEOPLE.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
        const gs = GROUPS.filter(g => g.name.toLowerCase().includes(q)).slice(0, 4);
        const ug = (S.ugroups || []).filter(g => g.name.toLowerCase().includes(q)).slice(0, 4);
        box.innerHTML = [...ps.map(p => `<div class="rowline">${avatarHTML(p.name, HUES[PEOPLE.indexOf(p) % HUES.length], 36)}<div class="tt"><div class="sn">${esc(p.name)}</div><div class="mt">${esc(p.ct)} · ${fmt(p.fl)} ${esc(t('followers_n'))}</div></div><button class="btn ghost sm" data-act="viewPerson" data-u="${p.id}">${esc(t('view_prof'))}</button><button class="btn sm" data-act="followP" data-u="${p.id}">${S.follows.includes(p.id) ? esc(t('following')) : esc(t('follow'))}</button></div>`).join(''), ...gs.map(g => `<div class="rowline"><span class="gi" style="font-size:18px">${g.ic}</span><div class="tt"><div class="sn">${esc(g.name)}</div><div class="mt">${fmt(g.m)} ${esc(t('g_members'))}</div></div><button class="btn ${S.myGroups.includes(g.id) ? 'ghost' : 'sm'}" data-act="tsJoin" data-g="${g.id}">${S.myGroups.includes(g.id) ? esc(t('joined')) : esc(t('join'))}</button><button class="btn ghost sm" data-act="grpOpen" data-g="${g.id}">${esc(t('open'))}</button></div>`).join(''), ...ug.map(g => `<div class="rowline"><span class="gi" style="font-size:18px">👥</span><div class="tt"><div class="sn">${esc(g.name)}</div><div class="mt">${fmt(g.members.length)} ${esc(t('g_members'))} · 👤 ${esc(g.owner)}</div></div><button class="btn ghost sm" data-act="openUG" data-id="${g.id}">${esc(t('open'))}</button><button class="btn ${g.members.includes(me() ? me().name : '') ? 'ghost' : 'sm'}" data-act="gJoin" data-id="${g.id}">${g.members.includes(me() ? me().name : '') ? esc(t('joined')) : esc(t('join'))}</button></div>`).join('')].join('') || `<p style="color:var(--mut)">${esc(t('no_res'))}</p>`;
    }
    ;
    r('');
    $('#fsIn').oninput = e => r(e.target.value);
}

/* ================= language ================= */
function langPanel() {
    modal(`<h3>${ic('globe')} Language · ভাষা · اللغة</h3><p class="sub">${esc(t('langsNote'))}</p>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;max-height:36vh;overflow-y:auto">
   ${LANGS.map( ([c,n]) => `<button class="mitem" data-act="setLang" data-lang="${c}" style="${S.lang === c ? 'background:var(--blue-w);color:var(--blue)' : ''}"><span style="flex:1">${n}</span><span class="mono" style="font-size:10px;color:var(--mut)">${c.toUpperCase()}</span></button>`).join('')}</div>
   <div id="gtWrap" style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px"><div class="panelab" style="margin-bottom:8px">🌐 GOOGLE TRANSLATE — 100+ LANGUAGES · সব দেশের ভাষা</div>
     <div id="gtSlot"></div>
     <p style="font-size:12.5px;color:var(--mut);margin-top:8px">${S.lang === 'bn' ? 'প্রতিটি পোস্টের 🌐 বাটনে চাপলে সেই পোস্ট আপনার ভাষায় পড়া যাবে। আর নিচের মেনু থেকে পুরো সাইট অনুবাদ হবে।' : 'Tap 🌐 on any post to read it in your language. Or use the menu below to translate the whole site.'}</p>
   </div>`);
    setTimeout(mountGT, 80);
}
function setLang(l) {
    S.lang = l;
    save();
    document.documentElement.lang = l;
    document.documentElement.dir = RTL.has(l) ? 'rtl' : 'ltr';
    closeModal();
    applyI18n();
    renderHeader();
    renderView();
}
function applyI18n() {
    $$('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
    $$('[data-ph]').forEach(el => el.placeholder = t(el.dataset.ph));
}

/* ================= hero ================= */
function heroHTML() {
    const words = ['w_all', ...TOPIC_KEYS.map(k => TLBL[k])];
    const word = t(words[Math.floor(Date.now() / 2400) % words.length]);
    const v = 12480 + myPosts().reduce( (s, p) => s + p.reads.total, 0);
    return `<section id="hero"><div class="h-in">
    <div class="h-kicker">AUTOPHAGY<em style="font-style:normal">.</em> — ${esc(S.lang.toUpperCase())}</div>
    <h1>${t('hero_h').replace('{w}', `<span id="rotW">${esc(word)}</span>`)}</h1>
    <p class="h-sub">${esc(t('hero_sub'))}</p>
    <div class="h-row">
      <button class="tbtn pri" data-act="heroWrite" style="background:#fff;color:var(--blue);padding:12px 24px;font-size:15px">${ic('feather')}${esc(t('hero_cta'))}</button>
      <div class="h-stats">
        <div class="hstat"><b data-cnt="${v}">0</b><span>${esc(t('voices'))}</span></div>
        <div class="hstat"><b data-cnt="47">0</b><span>${esc(t('countries'))}</span></div>
        <div class="hstat"><b data-cnt="24">0</b><span>${esc(t('languages_l'))}</span></div>
      </div>
    </div>
    <div class="h-emos">
      <button class="stamp ${!activeEmo ? 'on' : ''}" data-act="emoF" data-e="">${esc(t('all_f'))}</button>
      ${TOPIC_KEYS.map(e => `<button class="stamp ${activeEmo === e ? 'on' : ''}" data-act="emoF" data-e="${e}">${esc(tl(e))}</button>`).join('')}
    </div></div></section>`;
}
function startHero() {
    heroTimers.forEach(clearInterval);
    heroTimers = [];
    $$('[data-cnt]').forEach(el => {
        const target = +el.dataset.cnt;
        const st = performance.now();
        const tick = n => {
            const p = Math.min(1, (n - st) / 900);
            el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1)
                requestAnimationFrame(tick)
        }
        ;
        requestAnimationFrame(tick)
    }
    );
    heroTimers.push(setInterval( () => {
        const el = document.getElementById('rotW');
        if (!el)
            return;
        const words = ['w_all', ...TOPIC_KEYS.map(k => TLBL[k])];
        el.textContent = t(words[Math.floor(Date.now() / 2400) % words.length]);
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
    }
    , 2400));
}




/* ================= composer ================= */
function composerHTML() {
    const u = me();
    if (!u)
        return `<section class="composer" style="display:flex;gap:14px;align-items:center;margin-top:26px">
    <span class="av" style="width:44px;height:44px;background:var(--blue-w);color:var(--blue)">${ic('feather')}</span>
    <div style="flex:1"><p style="font-family:var(--serif);font-size:17px">${esc(t('ph_comp'))}</p><p style="font-size:13px;color:var(--mut);margin-top:2px">${esc(t('m_login'))} →</p></div>
    <button class="btn sm" data-act="m_login">${esc(t('sign_in'))}</button></section>`;
    const asAnon = draftAnon || u.defAnon;
    return `<section class="composer" id="composer" style="margin-top:26px">
    <div class="comp-top">${avatarHTML(u.name, u.color, 44, u.photo, asAnon)}<textarea id="compTa" placeholder="${esc(t('ph_comp'))}"></textarea></div>
    <div class="comp-media" id="compMedia">${draftMedia.map( (m, i) => mediaPreview(m, i)).join('')}</div>
    <div class="comp-bar">
      <div class="tools">
        <button class="tool" data-act="addm" data-m="img">${ic('img')}${esc(t('photo'))}</button>
        <button class="tool" id="voiceBtn" data-act="recVoice">${ic('mic')}<span id="recLbl">${esc(t('voice'))}</span></button>
        <button class="tool" data-act="addm" data-m="vid">${ic('vid')}${esc(t('video'))}</button>
        <button class="tool ${asAnon ? 'on' : ''}" data-act="anonT">${ic(asAnon ? 'eyeoff' : 'user')}${esc(t('anon'))}</button>
      </div>
      <div class="emo-pick" id="emoPick">${TOPIC_KEYS.map(e => {
        const on = draftEmo === e;
        return `<button class="stamp ${on ? 'on' : ''}" style="--ec:${EMO_C(e)};${on ? `background:${EMO_C(e)};color:#fff;border-color:${EMO_C(e)}` : ''}" data-act="emo" data-e="${e}">${esc(tl(e))}</button>`
    }
    ).join('')}
      <button class="btn sm" data-act="publish">${esc(t('publish'))}</button></div>
    </div>
    <div class="emo-hint" id="emoHint">${esc(t('pick_feeling'))}</div>
    <div class="mono" style="font-size:10px;color:var(--mut);margin-top:10px;letter-spacing:.1em">${esc(t('posting_as'))}: ${asAnon ? 'ANONYMOUS' : esc(u.name.toUpperCase())} · ${esc(u.ct)} · 📰 ${esc(t('news_ok'))} · 🌐 ${esc(t('tr_note'))}${FBDB ? ' · <span style="color:var(--blue)">GLOBAL 🔥</span>' : ''}</div>
  </section>`;
}
function mediaPreview(m, i) {
    if (m.type === 'image')
        return `<div class="cm-item"><img src="${m.url}" alt=""><button class="cm-x" data-act="delm" data-i="${i}">${ic('x')}</button></div>`;
    if (m.type === 'audio')
        return `<div class="cm-item">${audioHTML(m.url)}<button class="cm-x" data-act="delm" data-i="${i}">${ic('x')}</button></div>`;
    return `<div class="cm-item"><video src="${m.url}" controls style="max-height:200px;border-radius:8px;width:100%"></video><button class="cm-x" data-act="delm" data-i="${i}">${ic('x')}</button></div>`;
}
function refreshComposer() {
    const c = $('#composer');
    if (!c)
        return;
    const ta = $('#compTa');
    if (ta)
        draftText = ta.value;
    c.outerHTML = composerHTML();
    const nt = $('#compTa');
    if (nt) {
        nt.value = draftText;
        nt.oninput = e => draftText = e.value
    }
}

/* ================= ads: slider + strips + pop-ups ================= */
function adSlideGo(n) {
    const slides = $$('#adBox .adslide');
    if (!slides.length)
        return;
    adSlideIdx = (n + slides.length) % slides.length;
    slides.forEach( (s, i) => s.classList.toggle('on', i === adSlideIdx));
    $$('#adBox .adnav button').forEach( (d, i) => d.classList.toggle('on', i === adSlideIdx));
}
function startAdSlider() {
    if (adSliderTimer) {
        clearInterval(adSliderTimer);
        adSliderTimer = null
    }
    const box = $('#adBox');
    if (!box)
        return;
    const slides = $$('#adBox .adslide');
    adSlideGo(0);
    if (slides.length > 1) {
        adSliderTimer = setInterval( () => adSlideGo(adSlideIdx + 1), 5000);
        box.onmouseenter = () => {
            if (adSliderTimer) {
                clearInterval(adSliderTimer);
                adSliderTimer = null
            }
        }
        ;
        box.onmouseleave = () => {
            if (!adSliderTimer)
                adSliderTimer = setInterval( () => adSlideGo(adSlideIdx + 1), 5000)
        }
        ;
    }
}
function stripHTML(a) {
    const mh = (a.media && a.media.type === 'image') ? `<img src="${a.media.url}" alt="">` : '';
    const left = a.expiresAt ? Math.max(1, Math.ceil((a.expiresAt - Date.now()) / 864e5)) + 'd' : t('ad_live');
    return `<div class="adstripwrap"><div class="adcard2 adstrip"><span class="adtype">AD · ${esc(a.type)}</span>
   <div class="adv" style="background:${AD_STYLES[a.type] || AD_STYLES.Banner}">${mh}<b>${esc(a.brand)}</b></div>
   <div class="ameta">${adminMode ? `<span>🎯 ${esc(CTRY[a.ct] || a.ct)} · ⏳ ${left}</span><span class="adTicker">${esc(t('ad_rev'))} +$${(S.adRev || 0).toFixed(4)}/s</span>` : '<span>AD</span>'}</div></div></div>`;
}
function renderStrips() {
    const live = liveAds();
    const h = live.filter(a => placeOf(a) === 'header')
      , f = live.filter(a => placeOf(a) === 'footer');
    const he = $('#adHead')
      , fe = $('#adFoot');
    const one = (arr, k) => {
        if (!arr.length)
            return '';
        stripIdx[k] = stripIdx[k] % arr.length;
        const a = arr[stripIdx[k]];
        return stripHTML(a)
    }
    ;
    if (he)
        he.innerHTML = one(h, 'header');
    if (fe)
        fe.innerHTML = one(f, 'footer');
}
function showPop(a) {
    closePop();
    const el = document.createElement('div');
    el.className = 'adpop' + (a.psize === 'large' ? ' large' : '');
    el.id = 'adPop';
    const mh = a.media ? (a.media.type === 'image' ? `<img class="admedia" src="${a.media.url}" alt="">` : `<video class="admedia" src="${a.media.url}" controls preload="metadata"></video>`) : '';
    el.innerHTML = `<button class="apx" data-act="popClose" aria-label="close">✕</button>${mh}
   <div class="adv" style="background:${AD_STYLES[a.type] || AD_STYLES.Banner}"><b>${esc(a.brand)}</b></div>
   <div class="ameta">${adminMode ? `<span>🎯 ${esc(CTRY[a.ct] || a.ct)}</span><span class="adTicker">${esc(t('ad_rev'))} +$${(S.adRev || 0).toFixed(4)}/s</span>` : '<span>AD</span>'}</div>`;
    document.body.appendChild(el);
}
function closePop() {
    const p = document.getElementById('adPop');
    if (p)
        p.remove()
}
function startPops() {
    if (popTimer) {
        clearInterval(popTimer);
        popTimer = null
    }
    closePop();
    const pops = liveAds().filter(a => placeOf(a) === 'pop');
    if (!pops.length)
        return;
    popIdx = 0;
    showPop(pops[0]);
    popTimer = setInterval( () => {
        const cur = liveAds().filter(a => placeOf(a) === 'pop');
        if (!cur.length) {
            clearInterval(popTimer);
            popTimer = null;
            closePop();
            return
        }
        popIdx = (popIdx + 1) % cur.length;
        showPop(cur[popIdx]);
    }
    , 12000);
}
function adPriceBox() {
    const dSel = $('#adDur')
      , pSel = $('#adPlace');
    if (!dSel)
        return;
    const du = AD_DURS[+dSel.value] || AD_DURS[0];
    const pl = PLACES.find(p => p.v === (pSel ? pSel.value : 'feed')) || PLACES[0];
    const price = adPrice(du, pl);
    const box = $('#adPriceBox');
    if (!box)
        return;
    box.innerHTML = `<div class="bankcard" style="margin:0 0 14px">
    <div class="money-row"><span>📍 ${esc(t(pl.k))} <span class="mono" style="color:var(--blue)">${esc(t(pl.mk))}</span></span><b>${esc(t('final_price'))}</b></div>
    <div class="money-row"><span>💰 ${esc(t('ad_total'))} — ${esc(t(du.k))}</span><b style="color:var(--blue);font-size:18px">${money(price)}</b></div>
    <div class="money-row"><span>${esc(t('ad_perday'))}</span><b>≈ ${money(price / du.d)}</b></div>
    <div class="money-row"><span>${esc(t('ad_permonth'))}</span><b>≈ ${money(price / du.d * 30)}</b></div>
    <div class="money-row"><span>📅 ${esc(t('ad_expiry'))}</span><b>${new Date(Date.now() + du.d * 864e5).toLocaleDateString()}</b></div>
  </div>`;
}
function pickAdMedia() {
    const inp = $('#fin');
    inp.accept = 'image/*,video/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const isVid = f.type && f.type.startsWith('video');
        const done = () => {
            const pv = $('#adUpPrev');
            if (pv)
                pv.innerHTML = adMediaData ? (adMediaData.type === 'image' ? `<img src="${adMediaData.url}" alt="">` : `<video src="${adMediaData.url}" controls></video>`) : ''
        }
        ;
        if (isVid) {
            if (f.size <= 1.2e6) {
                const rd = new FileReader();
                rd.onload = () => {
                    adMediaData = {
                        type: 'video',
                        url: rd.result
                    };
                    done()
                }
                ;
                rd.readAsDataURL(f)
            } else {
                adMediaData = {
                    type: 'video',
                    url: URL.createObjectURL(f),
                    sess: true
                };
                toast(t('large_file'), 'alert');
                done()
            }
        } else {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                const sc = Math.min(1, 900 / img.width);
                c.width = img.width * sc;
                c.height = img.height * sc;
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                adMediaData = {
                    type: 'image',
                    url: c.toDataURL('image/jpeg', 0.78)
                };
                done()
            }
            ;
            img.src = URL.createObjectURL(f);
        }
    }
    ;
    inp.click();
}
function openAdModal() {
    adMediaData = null;
    modal(`<h3>📢 ${esc(t('ad_t2'))}</h3><p class="sub">${esc(t('ad_sub'))}</p>
   <div class="adup" data-act="adUpload" role="button" tabindex="0">
     <span style="font-size:22px">📤</span>
     <div class="aup-t"><b>${esc(t('ad_up_t'))}</b><span>${esc(t('ad_up_s'))}</span></div>
     <div id="adUpPrev" style="display:flex;gap:8px"></div>
   </div>
   <div class="adcard" style="margin:0 0 14px"><span class="tag">${esc(t('ad_rate_t'))}</span>
     ${AD_DURS.map(du => `<div class="money-row"><span>${esc(t(du.k))}</span><b>${money(du.price)} · ≈${money(du.price / du.d)} ${esc(t('ad_perday'))}</b></div>`).join('')}
     <div class="money-row" style="border-top:1px solid var(--line);margin-top:4px;padding-top:6px"><span>📍 ${esc(t('place_t'))}</span><b>${esc(t('mult_feed'))} · ${esc(t('pl_header'))}/${esc(t('pl_footer'))} ${esc(t('mult_mid'))} · ${esc(t('pl_pop'))} ${esc(t('mult_pop'))}</b></div>
   </div>
   <div class="field"><label>${esc(t('ad_brand'))}</label><input id="adBrand"></div>
   <div class="field"><label>${esc(t('ad_email'))}</label><input id="adEmail" type="email"></div>
   <div class="field"><label>📱 ${esc(t('ad_phone'))}</label><input id="adPhone" placeholder="+8801XXXXXXXXX"></div>
   <div class="field"><label>${esc(t('ph_country'))}</label><select id="adCt">${Object.entries(CTRY).map( ([c,n]) => `<option value="${c}">${n}</option>`).join('')}</select></div>
   <div class="field"><label>${esc(t('ad_type'))}</label><select id="adTy"><option>Video</option><option>Banner</option><option>Placard</option><option>Photocard</option><option>Animation</option></select></div>
   <div class="field"><label>📍 ${esc(t('place_t'))}</label><select id="adPlace">${PLACES.map(p => `<option value="${p.v}">${esc(t(p.k))} — ${esc(t(p.mk))}</option>`).join('')}</select></div>
   <div class="field"><label>${esc(t('pop_size'))}</label><select id="adPsize"><option value="small">${esc(t('size_s'))} · 300px</option><option value="large">${esc(t('size_l'))} · 390px</option></select></div>
   <div class="field"><label>⏳ ${esc(t('ad_dur'))}</label><select id="adDur">${AD_DURS.map( (du, i) => `<option value="${i}">${esc(t(du.k))} — ${money(du.price)}</option>`).join('')}</select></div>
   <div id="adPriceBox"></div>
   <button class="btn" style="width:100%;justify-content:center" data-act="adPay">${ic('wallet')}${esc(t('ad_pay'))}</button>
   ${(S.ads || []).length ? `<div class="admine"><h5 class="panelab">${esc(t('my_ads'))}</h5>
     ${S.ads.slice(0, 8).map(a => {
        const stx = a.status === 'live' ? (AD_EXP(a) ? [t('st_expired'), 'expired'] : [t('st_live'), 'live']) : a.status === 'pending' ? [t('st_pending'), 'pending'] : a.status === 'expired' ? [t('st_expired'), 'expired'] : [t('st_rej'), 'rejected'];
        return `<div class="rowline"><div class="tt"><div class="sn">${esc(a.brand)} · ${esc(a.type)} · ${money(a.price || a.budget)}</div><div class="mt">${esc(t(placeInfo(a).k))} · ${a.durK ? esc(t(a.durK)) + ' · ' : ''}${a.expiresAt ? esc(t('ad_expiry')) + ' ' + new Date(a.expiresAt).toLocaleDateString() : ''}</div></div><span class="adstat ${stx[1]}">${esc(stx[0])}</span></div>`
    }
    ).join('')}
     ${S.ads.some(a => a.status === 'rejected') ? `<p style="font-size:12.5px;color:#8A2A2A;margin-top:8px">⚠️ ${esc(t('ad_rej_msg'))}</p>` : ''}
   </div>` : ''}`);
    const ds = $('#adDur')
      , ps = $('#adPlace');
    if (ds)
        ds.onchange = adPriceBox;
    if (ps)
        ps.onchange = adPriceBox;
    adPriceBox();
}
function adPayStep() {
    const brand = $('#adBrand').value.trim()
      , email = $('#adEmail').value.trim()
      , phone = $('#adPhone').value.trim()
      , ct = $('#adCt').value
      , ty = $('#adTy').value;
    const du = AD_DURS[+($('#adDur')?.value || 0)] || AD_DURS[0];
    const pl = PLACES.find(p => p.v === ($('#adPlace')?.value || 'feed')) || PLACES[0];
    const psize = $('#adPsize')?.value || 'small';
    const price = adPrice(du, pl);
    if (!brand || !email) {
        toast(t('err_name'), 'alert');
        return
    }
    const myCur = curFor(ct);
    adTemp = {
        brand,
        email,
        phone,
        ct,
        type: ty,
        place: pl.v,
        psize,
        price,
        dur: du.d,
        durK: du.k,
        expiresAt: Date.now() + du.d * 864e5,
        media: adMediaData || null,
        payCur: ct
    };
    const att = adTemp.media ? ` · 📎 ${adTemp.media.type === 'image' ? 'IMAGE' : 'VIDEO'}` : '';
    const B = S.bank;
    modal(`<h3>${esc(t('bank_t'))}</h3><p class="sub">${esc(t('ad_sum'))}: <b>${esc(brand)}</b> · ${ty} · ${esc(t(pl.k))} · ${esc(t(du.k))} · ${money(price)}${att}</p>
   ${adTemp.media ? `<div style="margin-bottom:12px">${adTemp.media.type === 'image' ? `<img src="${adTemp.media.url}" style="max-height:110px;border-radius:8px;border:1px solid var(--line)">` : `<video src="${adTemp.media.url}" controls style="max-height:110px;border-radius:8px;width:100%"></video>`}</div>` : ''}
   <div class="bankcard"><b style="font-family:var(--serif);font-size:17px">AUTOPHAGY PLC</b>
     <div class="mono" style="margin-top:6px">${esc(t('bank_ac'))}: <b>${esc(B.acc)}</b></div>
     <div>${esc(B.name)}</div>
     <div style="color:var(--mut);font-size:13px;margin-top:4px">${esc(B.holder)}</div>
     <div class="money-row" style="margin-top:8px"><span>📱 ${esc(t('bank_bkash'))}</span><b class="mono">${esc(B.bkash)}</b></div>
     <div class="money-row"><span>📱 ${esc(t('bank_nagad'))}</span><b class="mono">${esc(B.nagad)}</b></div>
     <div class="money-row"><span>📱 ${esc(t('bank_rocket'))}</span><b class="mono">${esc(B.rocket)}</b></div>
   </div>
   <div class="field"><label>💱 ${esc(t('cur_note'))} — ${esc(myCur[1])}</label><select id="adCurSel"><option value="USD">USD $</option>${Object.keys(CURR).map(c => `<option value="${c}">${CURR[c][1]} ${c}</option>`).join('')}</select><p class="mono" id="adCurAmt" style="font-size:13px;color:var(--blue);margin-top:6px"></p></div>
   <div class="money-row"><span>💰 ${esc(t('ad_total'))} (${esc(t(pl.k))} · ${esc(t(du.k))})</span><b style="color:var(--blue);font-size:17px">${money(price)}</b></div>
   <div class="money-row"><span>📅 ${esc(t('ad_expiry'))}</span><b>${new Date(adTemp.expiresAt).toLocaleDateString()}</b></div>
   <p style="font-size:13px;color:var(--mut);margin-top:8px">💳 Send ${money(price)} via bKash / Nagad / Rocket / Bank from any country, then submit the TRX ID.</p>
   <button class="btn" style="width:100%;justify-content:center" data-act="adPaid2">${ic('check')}${esc(t('ad_paid_next'))}</button>`);
    const updCur = () => {
        const cc = $('#adCurSel').value;
        const [cS,,cR] = curFor(cc);
        $('#adCurAmt').textContent = '≈ ' + cS + (price * cR).toLocaleString(undefined, {
            maximumFractionDigits: 2
        }) + ' ' + cc + ' = ' + money(price) + ' USD'
    }
    ;
    $('#adCurSel').onchange = updCur;
    updCur();
}
function adPaidStep() {
    if (!adTemp)
        return;
    modal(`<h3>🧾 ${esc(t('p_trx'))}</h3><p class="sub">${esc(t('ad_v_note'))}</p>
   <div class="field"><label>${esc(t('wd_m'))}</label><select id="apM"><option>bKash</option><option>Nagad</option><option>Rocket</option><option>Bank transfer</option><option>Card</option><option>Other</option></select></div>
   <div class="field"><label>${esc(t('p_trx'))} *</label><input id="apTrx" autocomplete="off"><p class="mono" style="font-size:10.5px;color:var(--mut);margin-top:4px">${esc(t('p_trx_req'))}</p></div>
   <div class="field"><label>${esc(t('p_shot'))}</label><div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap"><button class="btn ghost sm" data-act="apShot" type="button">${ic('img')}${esc(t('p_shot'))}</button><div id="apShotPrev" style="display:flex"></div></div></div>
   <button class="btn" style="width:100%;justify-content:center;margin-top:8px" data-act="adDone">${ic('check')}${esc(t('ad_paid'))}</button>`);
}
function pickApShot() {
    const inp = $('#fin');
    inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            const sc = Math.min(1, 420 / img.width);
            c.width = img.width * sc;
            c.height = img.height * sc;
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            adPayShot = c.toDataURL('image/jpeg', 0.8);
            const pv = $('#apShotPrev');
            if (pv)
                pv.innerHTML = `<img src="${adPayShot}" style="max-height:80px;border-radius:8px;border:1px solid var(--line)">`
        }
        ;
        img.src = URL.createObjectURL(f)
    }
    ;
    inp.click();
}
function adSlotHTML() {
    const feed = liveAds().filter(a => placeOf(a) === 'feed');
    let inner;
    if (feed.length) {
        const shown = feed.slice(0, 5);
        const slides = shown.map( (a, i) => {
            const mh = a.media ? (a.media.type === 'image' ? `<img class="admedia" src="${a.media.url}" alt="">` : `<video class="admedia" src="${a.media.url}" controls preload="metadata"></video>`) : '';
            return `<div class="adslide ${i === 0 ? 'on' : ''}"><span class="adtype">AD · ${esc(a.type)}</span><span class="adcount">${i + 1}/${shown.length}</span>
       ${mh}
       <div class="adv" style="background:${AD_STYLES[a.type] || AD_STYLES.Banner}"><b>${esc(a.brand)}</b></div>
       <div class="ameta">${adminMode ? `<span>🎯 ${esc(CTRY[a.ct] || a.ct)}</span><span class="adTicker">${esc(t('ad_rev'))} +$${(S.adRev || 0).toFixed(4)}/s</span>` : '<span>AD</span>'}</div></div>`;
        }
        ).join('');
        inner = `<div class="adslider" id="adBox">${slides}
     ${shown.length > 1 ? `<button class="adarrow l" data-act="adPrev">‹</button><button class="adarrow r" data-act="adNext">›</button><div class="adnav">${shown.map( (_, i) => `<button data-act="adDot" data-i="${i}"></button>`).join('')}</div>` : ''}
    </div>`;
    } else {
        inner = `<div class="adcard2"><span class="adtype">AD</span>
     <div class="adv" style="background:linear-gradient(120deg,#0B0B16,#26265F);cursor:pointer" data-act="openAds"><b>${esc(t('your_ad'))}</b><span style="font-size:13.5px;opacity:.8">${esc(t('ad_sub'))}</span><span class="btn sm" style="align-self:flex-start;margin-top:8px">📤 ${esc(t('ad_up_t'))}</span></div>
     <div class="ameta"><span>AUTOPHAGY ADS</span><span>🌍 ALL COUNTRIES · FEED / HEADER / FOOTER / POP</span></div></div>`;
    }
    const pend = (S.ads || []).filter(x => x.status === 'pending').length;
    const pendNote = pend ? `<div class="ashint" style="justify-content:flex-start;gap:14px"><span>⏳ ${pend} — ${esc(t('st_pending'))}</span><button class="pact" data-act="adAdmin" style="letter-spacing:.06em;color:var(--blue);font-weight:700">✅ ${esc(t('ad_admin_t'))} →</button></div>` : '';
    return inner + pendNote + `<div class="ashint"><span>${esc(t('adsense_note'))}</span><span>AD</span></div><div id="adsenseSlot"><!-- ═══ GOOGLE ADSENSE: paste your <script> + <ins> ad code here after site approval ═══ --></div>`;
}

/* ================= ad approval — authority + notify + bank edit ================= */
const ADMIN_PIN = '2468';
async function notifyAdvertiser(a, ok) {
    const msg = ok ? a.brand + ' — ' + t('n_pay_ok') : a.brand + ' — ' + t('n_pay_no');
    addNotif(msg, ok ? 'check' : 'alert');
    toast(ok ? t('n_send_ok') : t('n_send_rej'), 'send');
    try {
        if (EMAILJS_CFG.SERVICE && EMAILJS_CFG.TEMPLATE && EMAILJS_CFG.PUBLIC_KEY && window.emailjs) {
            if (!window._ejInit) {
                emailjs.init(EMAILJS_CFG.PUBLIC_KEY);
                window._ejInit = true
            }
            await emailjs.send(EMAILJS_CFG.SERVICE, EMAILJS_CFG.TEMPLATE, {
                to_email: a.email,
                to_name: a.brand,
                message: msg
            });
        }
        if (CALLMEBOT_KEY && a.phone) {
            await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(a.phone)}&text=${encodeURIComponent(msg)}&apikey=${encodeURIComponent(CALLMEBOT_KEY)}`);
        }
    } catch (e) {
        console.warn('notify fail', e)
    }
}
function adAdminPanel() {
    pinOk = false;
    modal(`<h3>✅ ${esc(t('ad_admin_t'))}</h3><p class="sub">${esc(t('ad_pin'))}</p>
   <div class="field pinrow"><input id="adPin" inputmode="numeric" maxlength="6" placeholder="••••"><button class="btn sm" data-act="adAdminGo">${ic('lock')}</button></div>
   <div id="adAdminList"></div>`);
}
function bankEditHTML() {
    const B = S.bank;
    return `<div class="adcard" style="margin:14px 0"><span class="tag">🏦 ${esc(t('bank_edit'))}</span>
   <div class="field"><label>${esc(t('bank_ac'))}</label><input id="bkAcc" value="${esc(B.acc)}"></div>
   <div class="field"><label>${esc(t('p_bank'))}</label><input id="bkName" value="${esc(B.name)}"></div>
   <div class="field"><label>${esc(t('p_holder'))}</label><input id="bkHolder" value="${esc(B.holder)}"></div>
   <div class="field"><label>📱 ${esc(t('bank_bkash'))}</label><input id="bkBkash" value="${esc(B.bkash)}"></div>
   <div class="field"><label>📱 ${esc(t('bank_nagad'))}</label><input id="bkNagad" value="${esc(B.nagad)}"></div>
   <div class="field"><label>📱 ${esc(t('bank_rocket'))}</label><input id="bkRocket" value="${esc(B.rocket)}"></div>
   <button class="btn sm" data-act="bankSave">${ic('check')}${esc(t('save'))}</button></div>`;
}
function adAdminList() {
    const pend = (S.ads || []).filter(a => a.status === 'pending');
    const past = (S.ads || []).filter(a => a.status !== 'pending');
    const box = $('#adAdminList');
    if (!box)
        return;
    if (!pinOk) {
        box.innerHTML = '';
        return
    }
    box.innerHTML = `<div class="bankcard" style="margin:0 0 12px"><div class="money-row"><span>💰 ${esc(t('az_pool'))}</span><b style="color:var(--blue);font-size:18px">${money(azPool())}</b></div><p class="mono" style="font-size:10.5px;color:var(--mut)">${esc(t('az_comm_note'))}</p></div>` + bankEditHTML() + (pend.length ? pend.map(a => `<div class="rowline">${(a.shot ? `<img src="${a.shot}" style="width:56px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--line)">` : ((a.media && a.media.type === 'image') ? `<img src="${a.media.url}" style="width:56px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--line)">` : ''))}
    <div class="tt"><div class="sn">${esc(a.brand)} · ${esc(a.type)} · ${money(a.price || a.budget)}</div>
    <div class="mt">📍 ${esc(t(placeInfo(a).k))} · ⏳ ${a.durK ? esc(t(a.durK)) : '—'} · 📅 ${a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : '—'}</div>
    <div class="mt">💳 ${esc(a.method || '—')} · 🔑 TRX: <b class="mono" style="color:var(--blue)">${esc(a.trx || '—')}</b></div>
    <div class="chkline">✅ TRX ✓ · 💰 ${money(a.price || a.budget)} ✓ · 📅 ${a.durK ? esc(t(a.durK)) : '—'} ✓ · 📸 screenshot ✓<br>📧 ${esc(a.email || '—')} ✓${a.phone ? '<br>📱 ' + esc(a.phone) + ' ✓' : ''}</div></div>
    <button class="btn sm" data-act="adApprove" data-id="${a.id}">${ic('check', 'width:13px;height:13px')}${esc(t('ad_approve'))}</button>
    <button class="btn ghost sm" style="color:#8A2A2A;border-color:#8A2A2A" data-act="adReject" data-id="${a.id}">${esc(t('ad_reject'))}</button></div>`).join('') : '') + (past.length ? `<h5 class="panelab" style="margin:18px 0 4px">HISTORY</h5>` + past.map(a => {
        const stx = a.status === 'live' && AD_EXP(a) ? [t('st_expired'), 'expired'] : a.status === 'expired' ? [t('st_expired'), 'expired'] : a.status === 'live' ? [t('st_live'), 'live'] : [t('st_rej'), 'rejected'];
        return `<div class="rowline"><div class="tt"><div class="sn">${esc(a.brand)} · ${esc(a.type)} · ${money(a.price || a.budget)}</div><div class="mt">${esc(t(placeInfo(a).k))} · 🔑 TRX: ${esc(a.trx || '—')}</div></div>${a.shot ? `<a href="${a.shot}" download="autophagy-trx-${a.id}.png" class="pact" title="download">⬇️📸</a>` : ''}<span class="adstat ${stx[1]}">${esc(stx[0])}</span></div>`
    }
    ).join('') : '') + (S.wds.length ? `<h5 class="panelab" style="margin:18px 0 4px">💰 ${esc(t('t_earnings'))} SCREENSHOTS</h5>` + S.wds.map(w => `<div class="rowline">${w.shot ? `<img src="${w.shot}" style="width:56px;height:40px;object-fit:cover;border-radius:6px"><a href="${w.shot}" download="earn-${w.ts}.png" class="pact">⬇️</a>` : ''}<div class="tt"><div class="sn mono">${esc(w.acc)}</div><div class="mt">${esc(w.holder || '')} · ${money(w.amt)}</div></div></div>`).join('') : '') + (!pend.length ? `<p style="color:var(--mut);margin-top:10px">${esc(t('ad_none'))}</p>` : '');
}

/* ================= Earn Zone — share & earn ================= */
function pickAzImg() {
    const inp = $('#fin');
    inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            const sc = Math.min(1, 900 / img.width);
            c.width = img.width * sc;
            c.height = img.height * sc;
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            azImgData = c.toDataURL('image/jpeg', 0.78);
            const pv = $('#azImgPrev');
            if (pv)
                pv.innerHTML = `<img src="${azImgData}" style="max-height:90px;border-radius:8px;border:1px solid var(--line)">`
        }
        ;
        img.src = URL.createObjectURL(f)
    }
    ;
    inp.click();
}
function renderAdZone() {
    const links = S.adLinks || [];
    const mine = links.filter(l => l.by === 'me');
    const others = links.filter(l => l.by !== 'me');
    const azWd = myAzWd()
      , availAz = Math.max(0, myAzEarn() - azWd);
    const linkRow = l => {
        const net = AD_NETS[l.net] || AD_NETS.adsterra;
        const owner = l.by === 'me' ? t('you') : ((person(l.by) || {}).name || 'Writer');
        if (l.img) {
            return `<div style="width:100%;padding:14px 0;border-bottom:1px solid var(--line)">
       <a class="azlink-img" href="${esc(l.url)}" target="_blank" rel="noopener nofollow" data-act="azHit" data-id="${l.id}">
        <img src="${esc(l.img)}" alt="" loading="lazy">
        <span class="azimg-v">👁 ${fmt(l.clicks || 0)} · 💰 ${money(linkEarn(l))}</span>
        <span class="azimg-t"><span>${esc(l.desc || l.title)}</span><span class="ctat">${esc(t('az_cta'))}</span></span>
       </a>
       <div style="display:flex;gap:10px;align-items:center;padding:8px 2px 0;flex-wrap:wrap">
        <span class="azic" style="background:${net.c}22;color:${net.c};width:34px;height:34px;font-size:18px">${net.ic}</span>
        <b style="font-size:14px">${esc(l.title)}</b>
        <span class="mono" style="font-size:10px;color:var(--mut)">👤 ${esc(owner)}</span>
        <span class="azclicks" style="margin-inline-start:auto">👁 ${fmt(l.clicks || 0)} ${esc(t('az_clicks'))}</span>
        <button class="btn ghost sm" data-act="azCopy" data-url="${esc(l.url)}">${ic('share', 'width:13px;height:13px')}${esc(t('az_copy'))}</button>
        ${l.by === 'me' ? `<button class="pact" data-act="azDel" data-id="${l.id}" title="${esc(t('az_del_l'))}">${ic('trash')}</button>` : ''}
       </div></div>`;
        }
        return `<div class="aznet"><span class="azic" style="background:${net.c}22;color:${net.c}">${net.ic}</span>
     <div class="aztt"><b>${esc(l.title)}</b><span>${esc(net.name)} — ${esc(net.desc)}</span>
     <span class="azurl" title="${esc(l.url)}">${esc(l.url)}</span></div>
     <span class="azclicks">👁 ${fmt(l.clicks || 0)} ${esc(t('az_clicks'))} · 💰 ${money(linkEarn(l))}</span>
     <button class="btn sm" data-act="azClick" data-id="${l.id}" data-url="${esc(l.url)}">${ic('zap', 'width:13px;height:13px')}${esc(t('az_cta'))}</button>
     <button class="btn ghost sm" data-act="azCopy" data-url="${esc(l.url)}">${ic('share', 'width:13px;height:13px')}${esc(t('az_copy'))}</button>
     ${l.by === 'me' ? `<button class="pact" data-act="azDel" data-id="${l.id}" title="${esc(t('az_del_l'))}">${ic('trash')}</button>` : ''}
     <span class="mono" style="font-size:10px;color:var(--mut);width:100%">👤 ${esc(owner)}</span>
    </div>`;
    }
    ;
    $('#view').innerHTML = `<div class="surge-h"><h2>💰 ${esc(t('az_t'))}</h2><p>${esc(t('az_sub'))}</p></div>
   <div class="slist" style="max-width:780px">
   <div class="azcard">
     <div><div class="panelab">${esc(t('az_myearn'))}</div><div class="bignum" style="color:var(--blue)">${money(myAzEarn())}</div>
     <p class="mono" style="font-size:10.5px;color:var(--mut)">${esc(t('az_est'))}</p></div>
     <div><div class="panelab">${esc(t('az_clicks'))}</div><div class="bignum">${fmt(myAzClicks())}</div></div>
     <div><div class="panelab">${esc(t('az_withdrawn'))}</div><div class="bignum" style="font-size:22px">${money(azWd)}</div></div>
     <button class="btn" data-act="azWd" ${availAz < 10 ? 'disabled' : ''}>${ic('wallet')}${esc(t('az_wd'))}</button>
     <p class="mono" style="font-size:10.5px;color:var(--mut);width:100%">⏱ ${esc(t('wd_72'))} · 📉 ${esc(t('az_wd_note'))}</p>
   </div>
   <div class="azhow"><b>📖 ${esc(t('az_how'))}</b>
 ${esc(t('az_how_d'))}</div>
   <button class="btn" style="width:100%;justify-content:center;margin-bottom:18px" data-act="azAdd">${ic('send')}${esc(t('az_add'))}</button>
   ${mine.length ? `<div class="azsec"><h5 class="panelab">${esc(t('az_mine'))} (${mine.length})</h5>${mine.map(linkRow).join('')}</div>` : ''}
   <div class="azsec"><h5 class="panelab">${esc(t('az_all'))} (${others.length})</h5>
   ${others.length ? AD_NET_KEYS.map(nk => {
        const nl = others.filter(l => l.net === nk);
        if (!nl.length)
            return '';
        const net = AD_NETS[nk];
        return `<div style="margin:14px 0"><span class="aztag" style="background:${net.c}">${net.ic} ${esc(net.name)}</span>${nl.map(linkRow).join('')}</div>`;
    }
    ).join('') : `<p style="color:var(--mut);padding:16px 0;text-align:center">${esc(t('az_empty'))}</p>`}
   </div></div>`;
}
function openAddAdLink() {
    if (!me())
        return openAuth('login');
    azImgData = null;
    modal(`<h3>💰 ${esc(t('az_add'))}</h3><p class="sub">${esc(t('az_net_pick'))}</p>
   <div class="field"><label>${esc(t('az_net'))}</label><select id="azNet">${AD_NET_KEYS.map(k => `<option value="${k}">${AD_NETS[k].ic} ${AD_NETS[k].name} — ${AD_NETS[k].desc}</option>`).join('')}</select></div>
   <div class="field"><label>${esc(t('az_url'))} *</label><input id="azUrl" placeholder="https://..." autocomplete="off"><p class="mono" style="font-size:10.5px;color:var(--mut);margin-top:5px">${esc(t('az_img'))}</p></div>
   <div class="azcard"><span class="tag">${esc(t('az_img_pick'))} + ${esc(t('az_desc'))}</span>
     <div class="azfield"><button class="btn ghost sm" data-act="azImgPick" type="button">${ic('img')}${esc(t('az_img_pick'))}</button><div id="azImgPrev" style="margin-top:8px"></div></div>
     <div class="azfield"><label>${esc(t('az_title'))}</label><input id="azTitle" placeholder="My Direct Link"></div>
     <div class="azfield"><label>${esc(t('az_desc'))}</label><textarea id="azDesc" placeholder="${esc(t('az_desc_ph'))}"></textarea></div>
   </div>
   <button class="btn" style="width:100%;justify-content:center" data-act="azSave">${ic('check')}${esc(t('az_share'))}</button>`);
}
function azSaveLink() {
    const net = $('#azNet').value
      , url = $('#azUrl').value.trim()
      , title = $('#azTitle').value.trim() || AD_NETS[net].name
      , desc = $('#azDesc') ? $('#azDesc').value.trim() : '';
    if (!url || !url.startsWith('http')) {
        toast(t('err_name'), 'alert');
        return
    }
    if (BAD_RE.test(url) || BAD_RE.test(title) || linkBad(url)) {
        spongeBlock(null);
        return
    }
    S.adLinks = S.adLinks || [];
    S.adLinks.unshift({
        id: uid(),
        by: 'me',
        net,
        url,
        title,
        desc,
        img: azImgData || null,
        clicks: 0,
        ts: Date.now()
    });
    azImgData = null;
    save();
    closeModal();
    toast(t('az_share') + ' ✓', 'check');
    renderAdZone();
}
function azClick(id, url) {
    const l = (S.adLinks || []).find(x => x.id === id);
    if (l) {
        l.clicks = (l.clicks || 0) + 1;
        save()
    }
    window.open(url, '_blank', 'noopener');
    if (view === 'adzone')
        renderAdZone();
}
function azHit(id) {
    const l = (S.adLinks || []).find(x => x.id === id);
    if (l) {
        l.clicks = (l.clicks || 0) + 1;
        save()
    }
}
function azCopyLink(url) {
    if (navigator.clipboard)
        navigator.clipboard.writeText(url).catch( () => {}
        );
    toast(t('share_ok'), 'share');
}
function openAzWd() {
    if (!me())
        return openAuth('login');
    const availAz = Math.max(0, myAzEarn() - myAzWd());
    if (availAz < 10) {
        toast(t('wd_min'), 'alert');
        return
    }
    const u = me();
    modal(`<h3>💰 ${esc(t('az_wd'))}</h3><p class="sub">${esc(t('avail'))}: <b class="mono">${money(availAz)}</b></p>
   <div class="field"><label>${esc(t('wd_amt'))}</label><input id="azAmt" type="number" min="10" max="${availAz.toFixed(2)}" step="0.01" placeholder="10.00"></div>
   <div class="field"><label>${esc(t('c_country'))}</label><select id="azWdCt">${Object.keys(CTRY).map(c => `<option ${u.ct === c ? 'selected' : ''} value="${c}">${CTRY[c]}</option>`).join('')}</select></div>
   <div class="field"><label>${esc(t('wd_m'))}</label><select id="azWdM">${gwFor(u.ct).map(m => `<option>${m}</option>`).join('')}</select></div>
   <div class="field"><label>${esc(t('p_holder'))}</label><input id="azHolder" value="${esc(u.payout?.holder || u.name)}"><p class="mono" style="font-size:10.5px;color:var(--mut);margin-top:4px">${esc(t('p_holder_note'))}</p></div>
   <div class="setrow" style="border:none"><span class="sl"><b style="font-size:13.5px">${esc(t('wd_own'))}</b></span><input type="checkbox" id="azOwn" style="width:18px;height:18px;accent-color:var(--blue)"></div>
   <div class="bankcard" style="margin:8px 0"><div class="money-row"><span>📉 5% ${esc(t('fee'))}</span><b id="azWdComm">—</b></div>
   <div class="money-row"><span>💰 ${esc(t('net'))}</span><b id="azWdNet" style="color:var(--blue)">—</b></div>
   <p class="mono" style="font-size:10.5px;color:var(--mut)">${esc(t('az_comm_note'))}</p></div>
   <p class="mono" style="font-size:10.5px;color:var(--mut);margin:8px 0 14px">⏱ ${esc(t('wd_72'))}</p>
   <button class="btn" style="width:100%" id="azWdGo">${esc(t('wd_go'))}</button>`);
    const calc = () => {
        const v = parseFloat($('#azAmt').value) || 0;
        $('#azWdComm').textContent = '−' + money(v * AZ_COMM_RATE) + ' (5%)';
        $('#azWdNet').textContent = money(v * (1 - AZ_COMM_RATE));
        const ct = $('#azWdCt').value;
        $('#azWdM').innerHTML = gwFor(ct).map(m => `<option>${m}</option>`).join('')
    }
    ;
    $('#azAmt').oninput = calc;
    $('#azWdCt').onchange = calc;
    calc();
    $('#azWdGo').onclick = () => {
        const amt = parseFloat($('#azAmt').value)
          , mth = $('#azWdM').value
          , holder = $('#azHolder').value.trim();
        if (!(amt >= 10)) {
            toast(t('wd_min'), 'alert');
            return
        }
        if (amt > availAz) {
            toast('Max: ' + money(availAz), 'alert');
            return
        }
        if (!holder || holder.toLowerCase() !== me().name.toLowerCase()) {
            toast(t('p_holder') + ' ' + t('wd_name_err') + ' "' + me().name + '"', 'alert');
            return
        }
        if (!$('#azOwn').checked) {
            toast(t('wd_own'), 'alert');
            return
        }
        const comm = amt * AZ_COMM_RATE;
        S.azWds.unshift({
            id: uid(),
            by: 'me',
            amt,
            comm,
            method: mth,
            holder,
            ts: Date.now()
        });
        S.azComm = (S.azComm || 0) + comm;
        save();
        closeModal();
        toast(t('az_wd_ok') + ' — ' + money(amt) + ' · 5%: ' + money(comm), 'wallet');
        renderAdZone();
    }
    ;
}

/* ================= post card (translate + repost) ================= */
function postCard(p) {
    const u = me()
      , own = p.author === 'me';
    let who = null, aname;
    if (own) {
        if (u) {
            who = {
                name: u.name,
                hue: u.color,
                photo: u.photo,
                ct: u.ct
            };
            aname = u.name
        } else
            aname = t('you')
    } else if (p.remote) {
        who = p.anon ? null : {
            name: p.uname || 'Writer',
            hue: HUES[0],
            photo: null,
            ct: p.uct || ''
        };
        aname = p.anon ? t('anon') : (p.uname || 'Writer')
    } else {
        const x = person(p.author);
        if (x) {
            who = {
                name: x.name,
                hue: HUES[PEOPLE.indexOf(x) % HUES.length],
                ct: x.ct
            };
            aname = x.name
        } else
            aname = t('anon')
    }
    const hue = who ? who.hue : '#3A3A4A';
    const likesArr = Array.isArray(p.likes) ? p.likes : [];
    const liked = u && !p.remote && likesArr.includes(u.id);
    const cCount = (p.comments || []).reduce( (s, c) => s + 1 + (c.replies || []).length, 0);
    const ec = EMO_C(p.emotion);
    let bodyTxt = p.text;
    let rqHTML = '';
    if (p.repostOf) {
        const rm = (p.rMedia || []).map(m => `<img src="${m.url}" alt="" loading="lazy">`).join('');
        rqHTML = `<div class="rq"><div class="rqh">🔁 ${esc(t('r_by'))}: ${esc(p.rAuthor || 'Writer')}</div>${p.rText ? `<div class="p-body" style="font-size:16.5px">${fmtText(p.rText)}</div>` : ''}${rm ? `<div class="p-media">${rm}</div>` : ''}</div>`;
        bodyTxt = p.text || '';
    }
    const mediaHTML = (p.media || []).map(m => m.type === 'image' ? `<img src="${m.url}" alt="" loading="lazy">` : m.type === 'audio' ? audioHTML(m.url) : `<video src="${m.url}" controls preload="metadata"></video>`).join('');
    const nameBtn = (!own && person(p.author)) ? ' data-act="viewPerson" data-u="' + p.author + '" style="cursor:pointer"' : '';
    return `<article class="post" id="post-${p.id}">
   <div class="p-head">
     ${avatarHTML(aname, hue, 40, who ? who.photo : null, p.anon)}
     <div class="p-meta"><b${nameBtn}>${esc(p.anon || !who ? t('anon') : aname)}</b>${who ? `<span>· ${esc(who.ct)}</span>` : ''}${p.remote ? '<span style="color:var(--blue)">· 🔥</span>' : ''}${p.repostOf ? '<span style="color:var(--blue)">· 🔁</span>' : ''}<span>· ${timeAgo(p.ts)}</span>
       <span class="stamp" style="--ec:${ec};font-size:10px;padding:2px 8px">${esc(tl(p.emotion))}</span>
       <span class="p-reads">${ic('globe', 'width:13px;height:13px')}<span id="rd-${p.id}">${fmt(p.reads.total)}</span>&nbsp;${esc(t('reads'))}</span></div>
     ${u && !own && person(p.author) ? `<button class="btn ghost sm" data-act="followP" data-u="${p.author}" style="margin-inline-start:auto">${S.follows.includes(p.author) ? t('following') : t('follow')}</button>` : ''}
     ${own && u ? `<button class="pact" data-act="del" data-id="${p.id}" style="margin-inline-start:auto" title="${esc(t('del'))}">${ic('trash')}</button>` : ''}
   </div>
   ${bodyTxt ? `<div class="p-body">${fmtText(bodyTxt)}</div>` : ''}
   ${rqHTML}
   ${!p.repostOf && mediaHTML ? `<div class="p-media">${mediaHTML}</div>` : ''}
   <div class="p-acts">
     <button class="pact ${liked ? 'liked' : ''}" data-act="like" data-id="${p.id}">${ic('heart')}${fmt(typeof p.likes === 'number' ? p.likes : likesArr.length)}</button>
     <button class="pact" data-act="cmt" data-id="${p.id}">${ic('cmt')}${fmt(cCount)}</button>
     <button class="pact" data-act="share" data-id="${p.id}">${ic('share')}${fmt(p.shares || 0)}</button>
     <button class="pact" data-act="repost" data-id="${p.id}" title="${esc(t('repost'))}">${ic('repeat')}${esc(t('repost'))}</button>
     <button class="pact" data-act="trPost" data-id="${p.id}" title="${esc(t('tr_tip'))}">🌐</button>
     <button class="pact ${(S.bookmarks || []).includes(p.id) ? 'bmd' : ''}" data-act="bm" data-id="${p.id}" title="${esc(t('bm'))}">${ic('bookmark')}</button>
     <span class="sp"></span>
     ${own && u ? `<button class="pact" data-act="ins" data-id="${p.id}">${ic('zap')}${esc(t('insights'))}</button>
     <span class="p-reads" style="color:var(--blue)">${money(earnOf(p).n)}</span>` : ''}
   </div>
   ${own && u ? `<div class="ins hidden" id="ins-${p.id}">${insightHTML(p)}</div>` : ''}
   <div class="${openC.has(p.id) ? '' : 'hidden'}" id="cmts-${p.id}">${commentsHTML(p)}</div>
  </article>`;
}
function insightHTML(p) {
    const e = earnOf(p);
    const entries = Object.entries(p.reads.by || {}).sort( (a, b) => b[1] - a[1]).slice(0, 6);
    const ages = p.reads.byAge || {};
    const fp = 25 + hashStr(p.id) % 45;
    return `<h5>${esc(t('by_country'))}</h5>
   ${entries.map( ([c,n]) => `<div class="cbar"><span>${esc(CTRY[c] || c)}</span><span class="tr"><span class="fl" style="width:${Math.round(n / (p.reads.total || 1) * 100)}%"></span></span><span class="pc">${Math.round(n / (p.reads.total || 1) * 100)}%</span></div>`).join('')}
   <h5 style="margin-top:14px">${esc(t('by_age'))}</h5>
   ${AGEK.map(a => `<div class="cbar"><span>${a}</span><span class="tr"><span class="fl" style="width:${Math.round((ages[a] || 0) / (p.reads.total || 1) * 100)}%"></span></span><span class="pc">${Math.round((ages[a] || 0) / (p.reads.total || 1) * 100)}%</span></div>`).join('')}
   <h5 style="margin-top:14px">${esc(t('f_pct'))} / ${esc(t('uf_pct'))}</h5>
   <div class="split"><span class="a" style="width:${fp}%"></span><span class="b" style="width:${100 - fp}%"></span></div>
   <div class="split-l"><span>${esc(t('f_pct'))} ${fp}%</span><span>${esc(t('uf_pct'))} ${100 - fp}%</span></div>
   <div style="margin-top:12px">
     <div class="money-row"><span>${esc(t('gross'))}</span><b>${money(e.g)}</b></div>
     <div class="money-row"><span>${esc(t('fee'))}</span><b>−${money(e.f)}</b></div>
     <div class="money-row"><span>${esc(t('net'))}</span><b style="color:var(--blue)">${money(e.n)}</b></div>
     <div class="money-row"><span>${esc(t('cur_note'))} (${esc(me().ct)})</span><b>${locMoney(e.n, me().ct)}</b></div></div>`;
}
function commentsHTML(p) {
    const u = me();
    p.comments = p.comments || [];
    const nm = c => c.anon ? t('anon') : (c.by === 'me' ? (u ? u.name : 'You') : ((person(c.by) || {}).name || 'Writer'));
    const one = c => `<div class="cmt"><div class="cmt-h"><b>${esc(nm(c))}</b><span class="mono">${timeAgo(c.ts)}</span>
      <button class="pact" style="padding:2px 8px;font-size:11px" data-act="replyT" data-c="${c.id}" data-p="${p.id}">${esc(t('reply'))}</button>
      <button class="pact" style="padding:2px 8px;font-size:11px" data-act="trPost" data-id="${p.id}" data-skip="1" title="${esc(t('tr_tip'))}">🌐</button>
      ${u && c.by === 'me' ? `<button class="pact" style="padding:2px 8px;font-size:11px" data-act="cdel" data-p="${p.id}" data-c="${c.id}">${ic('trash', 'width:12px;height:12px')}</button>` : ''}</div>
      <div class="cmt-t">${esc(c.text)}</div>
      ${(c.replies || []).length ? `<div class="replies">${c.replies.map(r => `<div class="cmt"><div class="cmt-h"><b>${esc(nm(r))}</b><span class="mono">${timeAgo(r.ts)}</span></div><div class="cmt-t">${esc(r.text)}</div></div>`).join('')}</div>` : ''}
      ${replyTo.has(c.id) && u ? `<div class="cmt-form" style="margin-top:8px"><input class="ci" data-p="${p.id}" data-c="${c.id}" placeholder="${esc(t('ph_comment'))}"><button class="c-send" data-act="csend" data-p="${p.id}" data-c="${c.id}">${ic('send', 'width:15px;height:15px')}</button></div>` : ''}
    </div>`;
    return `<div class="cmts">${p.comments.map(one).join('')}
   ${u ? `<div class="cmt-form"><input class="ci" data-p="${p.id}" placeholder="${esc(t('ph_comment'))}"><button class="c-send" data-act="csend" data-p="${p.id}">${ic('send', 'width:15px;height:15px')}</button></div>` : `<button class="btn ghost sm" data-act="m_login" style="margin-top:6px">${esc(t('sign_in'))} — ${esc(t('comment'))}</button>`}</div>`;
}

/* ================= views ================= */
function go(v) {
    view = v;
    if (v === 'profile' && !viewState.ptab)
        viewState.ptab = 'posts';
    renderView();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    toggleMenu(false)
}
function renderView() {
    heroTimers.forEach(clearInterval);
    heroTimers = [];
    if (adSliderTimer) {
        clearInterval(adSliderTimer);
        adSliderTimer = null
    }
    if (view === 'feed')
        renderFeed();
    else if (view === 'profile')
        renderProfile();
    else if (view === 'person')
        renderPersonProfile(viewState.pid);
    else if (view === 'msgs')
        renderMsgs();
    else if (view === 'saved')
        renderSaved();
    else if (view === 'adzone')
        renderAdZone();
    else if (view === 'ugroup')
        openUGroup(viewState.gid);
    else if (view === 'pview')
        renderPView();
    renderHeader();
    startPops();
}
function renderFeed() {
    const tr = trendingTags();
    const grp = activeGroup ? GROUPS.find(g => g.id === activeGroup) : null;
    const lbl = k => TOPIC_KEYS.includes(k) ? tl(k) : k;
    const all = S.posts.concat(S.remote || []).sort( (a, b) => b.ts - a.ts);
    const list = all.filter(p => (!activeEmo || p.emotion === activeEmo) && (!activeTag || p.emotion === activeTag || (p.text || '').toLowerCase().includes('#' + activeTag)) && (!grp || p.emotion === grp.topic));
    $('#view').innerHTML = heroHTML() + `<div class="adslot">${adSlotHTML()}</div><div class="col">
    ${grp ? `<div class="trendrow"><span class="stamp on">${grp.ic} ${esc(grp.name)}</span><button class="pact" data-act="grpExit">✕ ${esc(t('all_f'))}</button></div>` : ''}
    ${tr.length ? `<div class="trendrow"><span class="panelab">${esc(t('trending'))}</span>${tr.map( ([k,n]) => `<button class="stamp ${activeTag === k ? 'on' : ''}" data-act="htag" data-tag="${esc(k)}">#${esc(lbl(k))} <span class="mono" style="opacity:.55">${n}</span></button>`).join('')}</div>` : ''}
    ${composerHTML()}${list.map(postCard).join('') || `<p style="text-align:center;color:var(--mut);padding:40px">${esc(t('no_res'))}</p>`}</div>`;
    startHero();
    startAdSlider();
    const ta = $('#compTa');
    if (ta) {
        ta.value = draftText;
        ta.oninput = e => draftText = e.value
    }
}
function renderPersonProfile(id) {
    const p = person(id);
    if (!p)
        return go('feed');
    view = 'person';
    viewState.pid = id;
    const hue = HUES[PEOPLE.indexOf(p) % HUES.length];
    const f = S.follows.includes(id);
    const posts = S.posts.filter(x => x.author === id);
    $('#view').innerHTML = `<button class="backb" data-act="backFeed">${ic('back', 'width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="cover" style="background:linear-gradient(120deg,${hue},#0000AD)"><span class="big">${esc((p.name[0] || '?').toUpperCase())}</span></div>
  <div class="p-head-main">
    <span class="p-av av" style="background:${hue}">${esc((p.name[0] || '?').toUpperCase())}</span>
    <div class="p-id"><h2>${esc(p.name)}</h2><div class="hd mono">${esc(p.ct)} · ${fmt(p.fl)} ${esc(t('followers_n'))}</div>
    <p style="font-family:var(--serif);font-style:italic;font-size:15px;margin-top:6px;color:#3A3A4C">${esc(p.bio)}</p></div>
    <div style="margin-inline-start:auto;display:flex;gap:8px;padding-bottom:6px">
      <button class="btn ${f ? 'ghost' : 'sm'}" data-act="followP" data-u="${p.id}">${f ? esc(t('following')) : esc(t('follow'))}</button>
      <button class="btn ghost sm" data-act="openmsg" data-u="${p.id}">${ic('cmt', 'width:14px;height:14px')}${esc(t('msg'))}</button>
    </div></div>
  <div class="col" style="padding-top:10px">${posts.map(postCard).join('') || `<p style="text-align:center;color:var(--mut);padding:40px">${esc(t('no_res'))}</p>`}</div>`;
    renderHeader();
}
function strikeAd() {
    const u = me();
    if (!u || !(u.strikes > 0))
        return '';
    return `<div class="notice">${ic('alert')}<div><b>${esc(t('spam_n'))}:</b> ${u.strikes} ${esc(t('blocked_note'))}.</div></div>
  <div class="adcard"><span class="tag">${esc(t('ad_t'))}</span><b style="font-family:var(--serif)">Autophagy Plus</b><p style="font-size:13.5px;color:var(--mut);margin-top:4px">${esc(t('ad_b'))}</p></div>`
}
function renderProfile() {
    const u = me();
    if (!u)
        return openAuth('login');
    const tab = viewState.ptab
      , my = myPosts();
    let pane = '';
    if (tab === 'posts') {
        const q = viewState.q.toLowerCase();
        const list = my.filter(p => !q || p.text.toLowerCase().includes(q) || p.emotion.includes(q));
        pane = `<div class="field" style="max-width:420px"><label>${ic('search', 'width:13px;height:13px')} ${esc(t('search_ph'))}</label><input id="ownQ" value="${esc(viewState.q)}" placeholder="${esc(t('search_ph'))}"></div>
    <div id="ownList">${list.length ? list.map(p => {
            const e = earnOf(p);
            return `<div class="rowline"><span class="stamp" style="--ec:${EMO_C(p.emotion)}">${esc(tl(p.emotion))}</span>
      <div class="tt"><div class="sn">${esc((p.text || '[' + t('photo') + ']').slice(0, 90))}</div>
      <div class="mt"><span id="rd2-${p.id}">${fmt(p.reads.total)}</span> ${esc(t('reads'))} · ${money(e.n)} · ${locMoney(e.n, u.ct)} · ${timeAgo(p.ts)}</div></div>
      <button class="btn ghost sm" data-act="openP" data-id="${p.id}">${esc(t('open'))}</button>
      <button class="pact" data-act="del" data-id="${p.id}">${ic('trash')}</button></div>`
        }
        ).join('') : `<p style="color:var(--mut);padding:20px 0">${esc(t('no_res'))}</p>`}</div>`;
    }
    if (tab === 'analytics') {
        const agg = {}
          , aggA = {};
        my.forEach(p => {
            Object.entries(p.reads.by || {}).forEach( ([c,n]) => agg[c] = (agg[c] || 0) + n);
            Object.entries(p.reads.byAge || {}).forEach( ([a,n]) => aggA[a] = (aggA[a] || 0) + n)
        }
        );
        const total = my.reduce( (s, p) => s + p.reads.total, 0) || 1;
        const top = Object.entries(agg).sort( (a, b) => b[1] - a[1]).slice(0, 12);
        const fp = 38;
        const pts = Array.from({
            length: 14
        }, (_, i) => 14 + Math.round(60 * Math.abs(Math.sin(hashStr(u.id + i) / 997))));
        pane = `<div class="pane-grid"><div>
      <div class="panelab">${esc(t('reads_total'))}</div><div class="bignum">${fmt(total)}</div>
      <svg viewBox="0 0 260 90" style="width:100%;max-width:420px;margin-top:8px"><polyline points="${pts.map( (v, i) => i * (260 / 13) + ',' + (90 - v)).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>
      <h5 class="panelab" style="margin:22px 0 10px">${esc(t('by_country'))}</h5>
      ${top.map( ([c,n]) => `<div class="cbar"><span>${esc(CTRY[c] || c)}</span><span class="tr"><span class="fl" style="width:${Math.round(n / total * 100)}%"></span></span><span class="pc">${fmt(n)}</span></div>`).join('')}
      <h5 class="panelab" style="margin:22px 0 10px">${esc(t('by_age'))}</h5>
      ${AGEK.map(a => `<div class="cbar"><span>${a}</span><span class="tr"><span class="fl" style="width:${Math.round((aggA[a] || 0) / total * 100)}%"></span></span><span class="pc">${Math.round((aggA[a] || 0) / total * 100)}%</span></div>`).join('')}
    </div><div>
      <h5 class="panelab" style="margin-bottom:10px">${esc(t('f_pct'))} / ${esc(t('uf_pct'))}</h5>
      <div class="split" style="height:16px"><span class="a" style="width:${fp}%"></span><span class="b" style="width:${100 - fp}%"></span></div>
      <div class="split-l" style="font-size:13px"><span><b style="color:var(--blue)">${fp}%</b> ${esc(t('f_pct'))}</span><span><b>${100 - fp}%</b> ${esc(t('uf_pct'))}</span></div>
      <div style="margin-top:26px"><div class="panelab">${esc(t('followers_n'))}</div><div class="bignum">${fmt(u.followers || 0)}</div></div>
      <div style="margin-top:18px"><div class="panelab">${esc(t('following_n'))}</div><div class="bignum">${S.follows.length}</div></div>
      <div style="margin-top:18px"><div class="panelab">${esc(t('posts_n'))}</div><div class="bignum">${my.length}</div></div>
    </div></div>`;
    }
    if (tab === 'earnings') {
        const a = avail()
          , life = my.reduce( (s, p) => s + earnOf(p).n, 0);
        pane = `<div style="display:flex;gap:40px;align-items:flex-end;flex-wrap:wrap">
      <div><div class="panelab">${esc(t('avail'))}</div><div class="bignum" style="color:var(--blue);font-size:52px">${money(a)}</div>
      <p class="mono" style="font-size:12px;color:var(--blue);margin-top:6px">${esc(t('cur_note'))}: <b>${locMoney(a, u.ct)}</b></p>
      <p class="mono" style="font-size:11px;color:var(--mut);margin-top:6px">${esc(t('wd_fee_note'))}</p></div>
      <div><div class="panelab">${esc(t('lifetime'))}</div><div class="bignum" style="font-size:26px">${money(life)}</div></div>
      <div><div class="panelab">${esc(t('withdrawn'))}</div><div class="bignum" style="font-size:26px">${money(S.withdrawn || 0)}</div></div>
      <button class="btn" data-act="wdOpen" ${a < 10 ? 'disabled' : ''}>${ic('wallet')}${esc(t('withdraw'))}</button></div>
     <h5 class="panelab" style="margin:30px 0 4px">${esc(t('t_earnings'))} — ${esc(t('t_posts'))}</h5>
     ${my.map(p => {
            const e = earnOf(p);
            return `<div class="rowline"><span class="stamp" style="--ec:${EMO_C(p.emotion)}">${esc(tl(p.emotion))}</span>
       <div class="tt"><div class="sn">${esc((p.text || '[' + t('photo') + ']').slice(0, 70))}</div><div class="mt">${fmt(p.reads.total)} ${esc(t('reads'))}</div></div>
       <div class="mono" style="font-size:12px;text-align:end;line-height:1.6">${esc(t('gross'))} ${money(e.g)}<br><span style="color:#A03A3A">−${esc(t('fee'))} ${money(e.f)}</span><br><b style="color:var(--blue)">${esc(t('net'))} ${money(e.n)}</b><br><span style="color:var(--mut)">${locMoney(e.n, u.ct)}</span></div></div>`
        }
        ).join('')}
     ${S.wds.length ? `<h5 class="panelab" style="margin:26px 0 4px">${esc(t('withdrawn'))} · ≤72h</h5>` + S.wds.map(w => `<div class="rowline">${w.shot ? `<img src="${w.shot}" style="width:46px;height:32px;object-fit:cover;border-radius:6px;border:1px solid var(--line)">` : ''}<span class="stamp" style="--ec:#0B6E4F">${esc(w.method)}</span><div class="tt"><div class="sn mono">${esc(w.acc)}</div><div class="mt">${esc(w.holder || '')} · ${new Date(w.ts).toLocaleString()} · ≤72h</div></div><b class="mono" style="color:var(--blue)">${money(w.amt)}<br><span style="font-size:11px;color:var(--mut)">${locMoney(w.amt, u.ct)}</span></b></div>`).join('') : ''}`;
    }
    if (tab === 'settings') {
        const colors = ['#0000AD', '#0B0B16', '#C0195B', '#0B6E4F', '#B4530A', '#5B3A82', '#0E7490'];
        pane = `${strikeAd()}
     <div class="field"><label>${esc(t('s_cover'))}</label><div style="display:flex;gap:9px;flex-wrap:wrap">
       <button class="btn ghost sm" data-act="coverModal">${ic('img')}${esc(t('c_change'))}</button>
       ${u.cover ? `<button class="btn ghost sm" data-act="coverRm">${ic('trash')}${esc(t('c_remove'))}</button>` : ''}
     </div></div>
     <div class="field"><label>${esc(t('payout_t'))}</label>
       <input id="pBank" placeholder="${esc(t('p_bank'))}" value="${esc(u.payout?.bank || '')}" style="margin-bottom:8px">
       <input id="pAcc" placeholder="${esc(t('p_acc'))}" value="${esc(u.payout?.acc || '')}" style="margin-bottom:8px">
       <input id="pHolder" placeholder="${esc(t('p_holder'))}" value="${esc(u.payout?.holder || u.name)}" style="margin-bottom:8px">
       <p class="mono" style="font-size:10.5px;color:var(--mut);margin-bottom:8px">${esc(t('p_holder_note'))}</p>
       <button class="btn sm" data-act="savePayout">${esc(t('p_save'))}</button></div>
     <div class="field"><label>${esc(t('s_name'))}</label><div style="display:flex;gap:9px"><input id="setName" value="${esc(u.name)}"><button class="btn sm" data-act="saveName">${esc(t('save'))}</button></div></div>
     <div class="field"><label>${esc(t('s_bio'))}</label><input id="setBio" value="${esc(u.bio || '')}" placeholder="—"></div>
     <div class="field"><label>${esc(t('c_country'))}</label><select id="setCt">${Object.entries(CTRY).map( ([c,n]) => `<option ${u.ct === c ? 'selected' : ''} value="${c}">${n}</option>`).join('')}</select></div>
     <div class="field"><label>${esc(t('s_color'))}</label><div class="swatches">
       ${colors.map(c => `<button class="sw ${u.color === c ? 'on' : ''}" style="background:${c}" data-act="color" data-c="${c}"></button>`).join('')}
       <input type="color" id="setColor" value="${u.color}"></div></div>
     <div class="setrow"><div class="sl"><b>${esc(t('s_anon'))}</b><span>${esc(t('anon'))}</span></div><button class="sw2 ${u.defAnon ? 'on' : ''}" data-act="anonDef"></button></div>
     <div class="setrow"><div class="sl"><b>${esc(t('reset_prof'))}</b><span>${esc(t('s_color'))} · ${esc(t('s_bio'))}</span></div><button class="btn ghost sm" data-act="resetProf">${esc(t('reset_prof'))}</button></div>
     <div class="setrow" style="border:none"><div class="sl"><b style="color:#8A2A2A">${esc(t('del_acc'))}</b><span>${esc(t('del_q'))}</span></div><button class="btn ghost sm" style="color:#8A2A2A;border-color:#8A2A2A" data-act="delAcc">${esc(t('del'))}</button></div>`;
    }
    if (tab === 'security') {
        const score = Math.min(100, 30 + (u.twoFA ? 40 : 0) + (u.pwScore || 12) + (u.photo ? 8 : 10));
        pane = `<div class="pane-grid"><div>
      <h3 style="font-family:var(--serif);margin-bottom:16px">${ic('shield')} ${esc(t('pw_t'))}</h3>
      <form id="pwForm"><div class="field"><label>${esc(t('pw_cur'))}</label><input type="password" id="pwCur" autocomplete="current-password"></div>
      <div class="field"><label>${esc(t('pw_new'))}</label><input type="password" id="pwNew" autocomplete="new-password"></div>
      <button class="btn sm" type="submit">${esc(t('pw_change'))}</button></form>
      <div class="setrow" style="margin-top:22px"><div class="sl"><b>${esc(t('tfa'))}</b><span>${esc(t('tfa_d'))}</span></div><button class="sw2 ${u.twoFA ? 'on' : ''}" data-act="tfa"></button></div>
      ${u.twoFA ? `<div class="adcard" style="margin-top:12px"><span class="tag">LIVE CODE · 30s</span><div class="bignum mono" id="tfaCode" style="font-size:30px">------</div><p class="mono" style="font-size:10.5px;color:var(--mut)">DEMO AUTHENTICATOR — ROTATES EVERY 30 SECONDS</p></div>` : ''}
      <div class="setrow"><div class="sl"><b>${esc(t('reset_pw'))}</b><span>${esc(t('forgot'))}</span></div><button class="btn ghost sm" data-act="resetpw">${ic('send')}${esc(t('reset_pw'))}</button></div>
     </div><div>
      <h5 class="panelab">${esc(t('sec_score'))}</h5>
      <div class="meter"><i style="width:${score}%"></i></div>
      <div class="split-l"><span class="mono">${score}/100</span><span class="mono">SHA-256 · 2FA · SESSION 12h</span></div>
      <h5 class="panelab" style="margin:22px 0 4px">${esc(t('session'))}</h5>
      <div class="alertrow">${ic('lock')}<span>This browser · ${esc(u.ct)} · now</span><button class="pact" data-act="revoke" style="margin-inline-start:auto;color:#8A2A2A">${esc(t('revoke'))}</button></div>
      <h5 class="panelab" style="margin:22px 0 4px">${esc(t('alerts'))}</h5>
      ${(u.alerts || []).map(a => `<div class="alertrow">${ic('bell')}<span>${esc(a)}</span></div>`).join('')}
     </div></div>`;
    }
    const covImg = u.cover && u.cover.type === 'img';
    const covCss = u.cover && u.cover.type === 'css' ? u.cover.css : null;
    const covStyle = covImg ? '' : covCss ? `background:${covCss}` : `background:${u.color}`;
    $('#view').innerHTML = `<div class="cover ${covImg ? 'cover-img' : ''}" style="${covStyle}">${covImg ? `<img src="${u.cover.url}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><span class="cover-sh"></span>` : ''}
   <button class="ccam" data-act="coverModal">${ic('img', 'width:14px;height:14px')}${esc(t('c_change'))}</button>
   ${!covImg ? `<span class="big">${esc((u.name[0] || 'A').toUpperCase())}</span>` : ''}</div>
   <div class="p-head-main">
     <span class="p-av av" style="background:${u.color}">${u.photo ? `<img src="${u.photo}">` : esc((u.name[0] || 'A').toUpperCase())}<button class="cam" data-act="avatar">${ic('img', 'width:14px;height:14px')}</button></span>
     <div class="p-id"><h2>${esc(u.name)}<button class="pact" data-act="editName" title="${esc(t('edit'))}">${ic('edit')}</button></h2>
     <div class="hd mono">@${esc(u.handle)} · ${esc(CTRY[u.ct] || u.ct)} · ${esc(t('joined'))} ${new Date(u.joined || Date.now()).toLocaleDateString()}</div>
     ${u.bio ? `<p style="font-family:var(--serif);font-style:italic;font-size:15px;margin-top:6px;color:#3A3A4C">${esc(u.bio)}</p>` : ''}</div>
     <div class="p-fstats"><button class="pact" data-act="pview" data-v="followers"><b>${fmt(u.followers || 0)}</b>${esc(t('followers_n'))}</button><button class="pact" data-act="pview" data-v="following"><b>${S.follows.length}</b>${esc(t('following_n'))}</button><button class="pact" data-act="pview" data-v="posts"><b>${my.length}</b>${esc(t('posts_n'))}</button></div>
   </div>
   <div style="padding:0 26px">${tab !== 'settings' ? strikeAd() : ''}</div>
   <div class="tabs">${['posts', 'analytics', 'earnings', 'settings', 'security'].map(x => `<button class="tab ${tab === x ? 'on' : ''}" data-act="tab" data-t="${x}">${esc(t('t_' + x))}</button>`).join('')}</div>
   <div class="pane">${pane}</div>`;
    const q = $('#ownQ');
    if (q)
        q.oninput = e => {
            viewState.q = e.target.value;
            const pos = e.target.selectionStart;
            renderProfile();
            const nq = $('#ownQ');
            nq.focus();
            nq.setSelectionRange(pos, pos)
        }
        ;
    const pwF = $('#pwForm');
    if (pwF)
        pwF.onsubmit = async e => {
            e.preventDefault();
            await changePw()
        }
        ;
    const sc = $('#setColor');
    if (sc)
        sc.oninput = e => {
            me().color = e.target.value;
            save();
            const cv = $('.cover');
            if (cv)
                cv.style.background = e.target.value
        }
        ;
    if (u.twoFA)
        tickTfa();
}
function renderPView() {
    const u = me();
    if (!u)
        return openAuth('login');
    const v = viewState.pv || 'posts';
    let rows = '';
    if (v === 'following') {
        const fl = S.follows.map(id => ({
            n: (person(id) || {}).name || id,
            ct: (person(id) || {}).ct || '',
            id
        }));
        rows = fl.length ? fl.map(x => `<div class="rowline">${avatarHTML(x.n, HUES[0], 36)}<div class="tt"><div class="sn">${esc(x.n)}</div><div class="mt">${esc(x.ct)}</div></div><button class="btn ghost sm" data-act="viewPerson" data-u="${x.id}">${esc(t('view_prof'))}</button></div>`).join('') : `<p style="color:var(--mut)">${esc(t('no_res'))}</p>`
    } else if (v === 'followers') {
        const demo = [{
            n: 'Mehrab Hossain',
            id: 'p_mehrab'
        }, {
            n: 'Amara Okafor',
            id: 'p_amara'
        }, {
            n: 'Kim Ha-eun',
            id: 'p_ken'
        }, {
            n: 'Yuki Tanaka',
            id: 'p_yuki'
        }, {
            n: 'Rafael Costa',
            id: 'p_rafa'
        }, {
            n: 'Lena Hoffmann',
            id: 'p_lena'
        }];
        rows = demo.map(x => `<div class="rowline">${avatarHTML(x.n, HUES[0], 36)}<div class="tt"><div class="sn">${esc(x.n)}</div><div class="mt">${t('followers_n')}</div></div><button class="btn ghost sm" data-act="viewPerson" data-u="${x.id}">${esc(t('view_prof'))}</button></div>`).join('')
    } else {
        const my = myPosts();
        rows = my.length ? my.map(p => `<div class="rowline"><span class="stamp" style="--ec:${EMO_C(p.emotion)}">${esc(tl(p.emotion))}</span><div class="tt"><div class="sn">${esc((p.text || '[' + t('photo') + ']').slice(0, 80))}</div><div class="mt">${fmt(p.reads.total)} ${esc(t('reads'))}</div></div><button class="btn ghost sm" data-act="openP" data-id="${p.id}">${esc(t('open'))}</button></div>`).join('') : `<p style="color:var(--mut)">${esc(t('no_res'))}</p>`
    }
    $('#view').innerHTML = `<button class="backb" data-act="backProf">${ic('back', 'width:15px;height:15px')}${esc(t('m_profile'))}</button>
  <div class="surge-h"><h2>${esc(t(v === 'followers' ? 'followers_n' : v === 'following' ? 'following_n' : 'posts_n'))}</h2></div>
  <div class="slist">${rows}</div>`;
    renderHeader();
}
async function tickTfa() {
    const el = $('#tfaCode');
    if (!el || !me() || !me().twoFA)
        return;
    el.textContent = await totp(me().tfaSec);
    setTimeout(tickTfa, 1000)
}
async function changePw() {
    const u = me()
      , cur = $('#pwCur').value
      , nw = $('#pwNew').value;
    if (await sha256(cur) !== u.pw) {
        toast(t('err_creds'), 'alert');
        return
    }
    if (nw.length < 8) {
        toast(t('err_pw'), 'alert');
        return
    }
    u.pw = await sha256(nw);
    u.pwScore = Math.min(20, nw.length * 2);
    save();
    toast(t('pw_ok'), 'shield');
    renderProfile();
}
function renderMsgs() {
    const u = me();
    if (!u)
        return openAuth('login');
    const list = PEOPLE.filter(p => S.follows.includes(p.id) || S.threads[p.id] || S.back[p.id]);
    if (!curThread && list.length)
        curThread = list[0].id;
    const th = curThread ? S.threads[curThread] || {
        log: [],
        u: 0
    } : null;
    if (th)
        th.u = 0;
    $('#view').innerHTML = `<div class="msgs">
    <div class="mlist">${list.map(p => {
        const last = (S.threads[p.id] && S.threads[p.id].log || []).slice(-1)[0];
        return `<div class="mrow ${curThread === p.id ? 'on' : ''}" data-act="openmsg" data-u="${p.id}">${avatarHTML(p.name, HUES[PEOPLE.indexOf(p) % HUES.length], 40)}
      <div style="flex:1;min-width:0"><b style="font-size:14px">${esc(p.name)}</b><div class="prev">${last ? esc(last.text.slice(0, 34)) : esc(p.bio)}</div></div>
      ${S.threads[p.id] && S.threads[p.id].u ? `<span class="un">${S.threads[p.id].u}</span>` : ''}</div>`
    }
    ).join('') || `<p style="padding:20px;color:var(--mut)">${esc(t('no_res'))}</p>`}</div>
    <div class="mthread">${curThread ? `
      <div class="mtop">${avatarHTML(person(curThread).name, HUES[PEOPLE.indexOf(person(curThread)) % HUES.length], 34)}<div><b>${esc(person(curThread).name)}</b><div class="mono" style="font-size:10.5px;color:var(--mut)">${esc(person(curThread).ct)} · ONLINE</div></div></div>
      <div class="mlog" id="mlog">${(th.log || []).map(m => `<div class="bub ${m.f === 'me' ? 'me' : 'you'}">${esc(m.text)}<span class="mono">${timeAgo(m.ts)}</span></div>`).join('')}</div>
      ${typing ? `<div style="padding:0 20px 6px" class="typing"><i></i><i></i><i></i></div>` : ''}
      <form class="mform" id="mForm"><input id="mIn" placeholder="${esc(t('msg_ph'))}" autocomplete="off"><button class="c-send" type="submit">${ic('send', 'width:15px;height:15px')}</button></form>` : `<div style="margin:auto;color:var(--mut);padding:40px;text-align:center">${esc(t('fs_t'))} →</div>`}</div></div>`;
    const log = $('#mlog');
    if (log)
        log.scrollTop = log.scrollHeight;
    const mf = $('#mForm');
    if (mf)
        mf.onsubmit = e => {
            e.preventDefault();
            sendMsg()
        }
        ;
}
function renderSaved() {
    const list = (S.bookmarks || []).map(id => S.posts.find(p => p.id === id)).filter(Boolean);
    $('#view').innerHTML = `<div class="surge-h"><h2>${esc(t('t_saved'))}</h2><p>${esc(t('tagline'))}</p></div>
  <div class="col" style="padding-top:10px">${list.length ? list.map(postCard).join('') : `<p style="text-align:center;color:var(--mut);padding:60px 20px">${esc(t('no_saved'))}</p>`}</div>`;
}
function sendMsg() {
    const inp = $('#mIn')
      , v = inp.value.trim();
    if (!v || !curThread)
        return;
    if (BAD_RE.test(v)) {
        spongeBlock(null);
        inp.value = '';
        return
    }
    S.threads[curThread] = S.threads[curThread] || {
        log: []
    };
    S.threads[curThread].log.push({
        f: 'me',
        text: v,
        ts: Date.now()
    });
    save();
    renderMsgs();
    const p = person(curThread);
    setTimeout( () => {
        typing = true;
        renderMsgs();
        setTimeout( () => {
            typing = false;
            S.threads[curThread] && S.threads[curThread].log.push({
                f: 'p',
                text: p.lines[Math.floor(Math.random() * p.lines.length)] || '…',
                ts: Date.now()
            });
            save();
            if (view === 'msgs' && curThread === p.id)
                renderMsgs();
            else {
                renderHeader();
                toast(p.name + ' — ' + t('msg_from'), 'cmt')
            }
        }
        , 1400 + Math.random() * 1400);
    }
    , 700);
}

/* ================= groups (user-created) ================= */
function openGroupCreate() {
    if (!me())
        return openAuth('login');
    modal(`<h3>👥 ${esc(t('g_create'))}</h3><p class="sub">${esc(t('g_share_az'))}</p>
   <div class="field"><label>${esc(t('az_title'))} *</label><input id="gnName" placeholder="Poetry Lovers"></div>
   <div class="field"><label>${esc(t('s_bio'))}</label><input id="gnDesc" placeholder="—"></div>
   <div class="field"><label>${esc(t('pick_feeling'))}</label><select id="gnTopic">${TOPIC_KEYS.map(k => `<option value="${k}">${esc(tl(k))}</option>`).join('')}</select></div>
   <button class="btn" style="width:100%;justify-content:center" data-act="gCreate">${ic('check')}${esc(t('join'))}</button>`);
}
function gCreate() {
    const name = $('#gnName').value.trim()
      , desc = $('#gnDesc').value.trim()
      , topic = $('#gnTopic').value;
    if (!name) {
        toast(t('err_name'), 'alert');
        return
    }
    S.ugroups = S.ugroups || [];
    const g = {
        id: 'ug' + uid(),
        name,
        desc,
        topic,
        owner: me().name,
        members: [me().name]
    };
    S.ugroups.unshift(g);
    save();
    closeModal();
    toast('✓ ' + name, 'users');
    openUGroup(g.id);
}
function openUGroup(gid) {
    const g = (S.ugroups || []).find(x => x.id === gid);
    if (!g)
        return go('feed');
    view = 'ugroup';
    viewState.gid = gid;
    const joined = g.members.includes(me() ? me().name : '@@');
    const posts = S.posts.filter(p => p.ugid === gid);
    const azl = (S.adLinks || []).slice(0, 3).map(l => `<div class="rowline"><span class="aztag" style="background:${AD_NETS[l.net].c}">${AD_NETS[l.net].ic} ${esc(AD_NETS[l.net].name)}</span><div class="tt"><div class="sn">${esc(l.title)}</div></div><button class="btn sm" data-act="azClick" data-id="${l.id}" data-url="${esc(l.url)}">${esc(t('az_cta'))}</button></div>`).join('');
    $('#view').innerHTML = `<button class="backb" data-act="backFeed">${ic('back', 'width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="cover" style="background:linear-gradient(120deg,#5B3A82,#0000AD)"><span class="big">👥</span></div>
  <div class="p-head-main"><div class="p-id"><h2>${esc(g.name)}</h2>
   <div class="hd mono">${fmt(g.members.length)} ${esc(t('g_members'))} · ${esc(tl(g.topic))} · 👤 ${esc(g.owner)}</div>
   ${g.desc ? `<p style="font-family:var(--serif);font-style:italic;color:#3A3A4C">${esc(g.desc)}</p>` : ''}</div>
   <div style="margin-inline-start:auto;display:flex;gap:8px;padding-bottom:6px">
   <button class="btn ${joined ? 'ghost' : 'sm'}" data-act="gJoin" data-id="${g.id}">${joined ? esc(t('joined')) : esc(t('join'))}</button></div></div>
   <div class="col" style="padding-top:10px">
   ${composerHTML()}
   <h5 class="panelab" style="margin:18px 0 4px">💰 ${esc(t('az_t'))} — ${esc(t('g_share_az'))}</h5>${azl || `<p style="color:var(--mut)">${esc(t('az_empty'))}</p>`}
   <h5 class="panelab" style="margin:18px 0 4px">${esc(t('t_posts'))}</h5>
   ${posts.map(postCard).join('') || `<p style="text-align:center;color:var(--mut);padding:30px">${esc(t('no_res'))}</p>`}</div>`;
    renderHeader();
    startPops();
}

/* ================= auth (secure) ================= */
function openAuth(mode='login', twoFa=false) {
    if (me())
        return;
    if (isLocked()) {
        toast(t('err_lock'), 'lock');
        return
    }
    const isL = mode === 'login';
    const countries = Object.entries(CTRY).map( ([c,n]) => `<option value="${c}">${n}</option>`).join('');
    const eye = `<button class="pact" data-act="pwEye" type="button" title="👁">👁</button>`;
    modal(`<h3>${esc(isL ? t('login_t') : t('signup_t'))}</h3><p class="sub">Autophagy<em style="font-style:normal;color:var(--blue)">.</em> — ${esc(t('tagline'))}</p>
  ${twoFa ? `<div class="field"><label>2FA CODE</label><input id="auCode" inputmode="numeric" maxlength="6" placeholder="000000"><p class="mono" style="font-size:10.5px;color:var(--mut);margin-top:6px">DEMO AUTHENTICATOR: <b id="tfaHint">------</b></p></div>
   <button class="btn" style="width:100%" data-act="do2fa">${esc(t('sign_in'))} →</button>` : `<form id="auForm">
    ${isL ? `<div class="field"><label>${esc(t('ph_handle'))}</label><input id="auHandle" placeholder="@demo_voice" autocomplete="username"></div>
      <div class="field"><label>${esc(t('ph_pw'))}</label><div style="display:flex;gap:8px;align-items:center"><input id="auPw" type="password" autocomplete="current-password" style="flex:1">${eye}</div></div>` : `<div class="field"><label>${esc(t('su_nid'))} *</label><input id="auNid" placeholder="—"></div>
      <div class="field"><label>${esc(t('su_cont'))} *</label><input id="auContact" placeholder="+8801XXXXXXXXX / you@mail.com"></div>
      <div class="field"><label>${esc(t('ph_name'))}</label><input id="auName" placeholder="—"></div>
      <div class="field"><label>${esc(t('ph_country'))}</label><select id="auCt">${countries}</select></div>
      <div class="field"><label>${esc(t('ph_pw'))}</label><div style="display:flex;gap:8px;align-items:center"><input id="auPw" type="password" autocomplete="new-password" style="flex:1">${eye}</div><div class="meter" style="margin-top:8px"><i id="pwMeter" style="width:0"></i></div><div class="split-l"><span class="mono" style="font-size:10px">${esc(t('strength'))}</span><span class="mono" style="font-size:10px" id="pwLbl"></span></div></div>
      <div class="field"><button class="btn ghost sm" data-act="auSelfie" type="button">${ic('img')}${esc(t('su_selfie'))}</button><div id="auSelfiePrev" style="margin-top:8px"></div></div>`}
    <button class="btn" style="width:100%" type="submit">${esc(isL ? t('sign_in') : t('join2'))}</button></form>
   <div style="text-align:center;margin-top:14px">
     <button class="pact" data-act="authTab" data-m="${isL ? 'signup' : 'login'}" style="width:100%;justify-content:center">${esc(isL ? t('need_acc') : t('have_acc'))}</button>
     ${isL ? `<button class="pact" data-act="forgot" style="width:100%;justify-content:center;font-size:12px">${esc(t('forgot'))}</button>
     <div class="msep"></div><button class="btn ghost sm" data-act="demo" style="width:100%;justify-content:center">${ic('zap', 'width:14px;height:14px')}${esc(t('or_demo'))}</button>` : ''}
   </div>`}`);
    const form = $('#auForm');
    if (form)
        form.onsubmit = async e => {
            e.preventDefault();
            if (isL) {
                if (isLocked()) {
                    toast(t('err_lock'), 'lock');
                    return
                }
                const h = $('#auHandle').value.trim().replace(/^@/, '')
                  , pw = $('#auPw').value;
                if (!S.acct || S.acct.handle !== h || await sha256(pw) !== S.acct.pw) {
                    failLogin();
                    return
                }
                if (S.acct.twoFA) {
                    openAuth('login', true);
                    return
                }
                resetFail();
                doLogin();
            } else {
                const nid = $('#auNid').value.trim()
                  , contact = $('#auContact').value.trim();
                const name = $('#auName').value.trim()
                  , ct = $('#auCt').value
                  , pw = $('#auPw').value;
                if (!nid || !contact) {
                    toast(t('err_name'), 'alert');
                    return
                }
                if (!name) {
                    toast(t('err_name'), 'alert');
                    return
                }
                if (pw.length < 8) {
                    toast(t('err_pw'), 'alert');
                    return
                }
                const pwScore = Math.min(20, pw.length * 2 + (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw) ? 4 : 0));
                S.acct = {
                    handle: (name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 14) || 'writer'),
                    pw: await sha256(pw),
                    twoFA: false,
                    tfaSec: uid() + uid(),
                    pwScore
                };
                doLogin({
                    name,
                    ct,
                    pwScore,
                    nid,
                    contact,
                    selfie: S.pendSelfie || null
                });
                S.pendSelfie = null;
            }
        }
        ;
    const mtr = $('#pwMeter');
    if (mtr)
        $('#auPw').oninput = e => {
            const v = e.target.value;
            const s = Math.min(100, v.length * 8 + (/[0-9]/.test(v) ? 15 : 0) + (/[^a-zA-Z0-9]/.test(v) ? 15 : 0));
            mtr.style.width = s + '%';
            mtr.style.background = s > 65 ? 'var(--blue)' : s > 35 ? '#B4530A' : '#8A2A2A';
            $('#pwLbl').textContent = s > 65 ? 'STRONG' : s > 35 ? 'OK' : 'WEAK'
        }
        ;
    if (twoFa) {
        (async function up() {
            const el = $('#tfaHint');
            if (!el)
                return;
            el.textContent = await totp(S.acct.tfaSec);
            setTimeout(up, 1000)
        }
        )()
    }
}
function doLogin(ov) {
    const a = S.acct;
    S.user = {
        id: 'me',
        name: ov && ov.name || 'Demo Writer',
        handle: a.handle,
        ct: ov && ov.ct || 'BD',
        color: '#0000AD',
        bio: '',
        photo: null,
        cover: null,
        payout: null,
        defAnon: false,
        twoFA: a.twoFA,
        tfaSec: a.tfaSec,
        pw: a.pw,
        pwScore: a.pwScore,
        followers: 128,
        joined: Date.now() - 9 * 864e5,
        strikes: 0,
        alerts: ['Chrome · ' + CTRY[ov && ov.ct || 'BD'] + ' · just now'],
        nid: ov && ov.nid || '',
        contact: ov && ov.contact || '',
        selfie: ov && ov.selfie || null
    };
    touchSession();
    if (!S.notifs.length) {
        S.notifs = [{
            id: uid(),
            icn: 'users',
            text: 'Mehrab Hossain ' + t('n_followback'),
            ts: Date.now() - 36e5,
            read: false
        }, {
            id: uid(),
            icn: 'heart',
            text: 'Amara Okafor ' + t('n_like'),
            ts: Date.now() - 72e5,
            read: false
        }]
    }
    save();
    closeModal();
    renderHeader();
    go('feed');
    toast(t('login_t') + ' — ' + t('tagline'), 'check');
    if (!S.notified) {
        S.notified = true;
        save();
        setTimeout( () => {
            S.back.p_mehrab = true;
            if (me())
                me().followers = (me().followers || 0) + 1;
            save();
            addNotif('Mehrab Hossain ' + t('n_followback'), 'users')
        }
        , 9000);
        setTimeout( () => {
            S.threads.p_mehrab = S.threads.p_mehrab || {
                log: []
            };
            S.threads.p_mehrab.log.push({
                f: 'p',
                text: 'I read your post about beginning again. My city has no sea — only rain. Still, I understood.',
                ts: Date.now()
            });
            S.threads.p_mehrab.u = (S.threads.p_mehrab.u || 0) + 1;
            save();
            renderHeader();
            toast('Mehrab Hossain — ' + t('msg_from'), 'cmt')
        }
        , 16000)
    }
}
function logout() {
    S.user = null;
    save();
    renderHeader();
    go('feed');
    toast(t('m_logout'), 'out')
}

/* ================= withdraw ================= */
function openWithdraw() {
    const a = avail();
    if (a < 10) {
        toast(t('wd_min'), 'alert');
        return
    }
    const u = me();
    wdShotD = null;
    modal(`<h3>${esc(t('wd_t'))}</h3><p class="sub">${esc(t('avail'))}: <b class="mono">${money(a)}</b></p>
   <div class="field"><label>${esc(t('wd_amt'))}</label><input id="wdAmt" type="number" min="10" max="${a.toFixed(2)}" step="0.01" placeholder="10.00"><p class="mono" id="wdLoc" style="font-size:11px;color:var(--blue);margin-top:6px">${esc(t('cur_note'))}: ${esc(locMoney(10, u.ct))}+</p></div>
   <div class="field"><label>${esc(t('c_country'))}</label><select id="wdCt">${Object.keys(CTRY).map(c => `<option ${u.ct === c ? 'selected' : ''} value="${c}">${CTRY[c]}</option>`).join('')}</select></div>
   <div class="field"><label>${esc(t('wd_m'))}</label><select id="wdM">${gwFor(u.ct).map(m => `<option>${m}</option>`).join('')}</select></div>
   <div class="field"><label>${esc(t('p_bank'))}</label><input id="wdBank" value="${esc(u.payout?.bank || '')}" placeholder="${esc(t('p_bank'))}"></div>
   <div class="field"><label>${esc(t('p_acc'))}</label><input id="wdAcc" value="${esc(u.payout?.acc || '')}" placeholder="01XXXXXXXXX"></div>
   <div class="field"><label>${esc(t('p_holder'))}</label><input id="wdHolder" value="${esc(u.payout?.holder || u.name)}"><p class="mono" style="font-size:10.5px;color:var(--mut);margin-top:4px">${esc(t('p_holder_note'))}</p></div>
   <div class="field"><label>${esc(t('wd_shot'))}</label><button class="btn ghost sm" data-act="wdShot" type="button">${ic('img')}${esc(t('wd_shot'))}</button><div id="wdShotPrev" style="margin-top:8px"></div></div>
   <div class="setrow" style="border:none"><span class="sl"><b style="font-size:13.5px">${esc(t('wd_own'))}</b></span><input type="checkbox" id="wdOwn" style="width:18px;height:18px;accent-color:var(--blue)"></div>
   <p class="mono" style="font-size:10.5px;color:var(--mut);margin:8px 0 14px">⏱ ${esc(t('wd_72'))}</p>
   <button class="btn" style="width:100%" id="wdGo">${esc(t('wd_go'))}</button>`);
    const updLoc = () => {
        const v = parseFloat($('#wdAmt').value) || 0;
        const ct = $('#wdCt').value;
        $('#wdLoc').textContent = t('cur_note') + ': ' + locMoney(v, ct);
        $('#wdM').innerHTML = gwFor(ct).map(m => `<option>${m}</option>`).join('')
    }
    ;
    $('#wdCt').onchange = updLoc;
    $('#wdAmt').oninput = updLoc;
    $('#wdGo').onclick = () => {
        const amt = parseFloat($('#wdAmt').value)
          , ct = $('#wdCt').value
          , mth = $('#wdM').value
          , bank = $('#wdBank').value.trim()
          , acc = $('#wdAcc').value.trim()
          , holder = $('#wdHolder').value.trim();
        if (!(amt >= 10)) {
            toast(t('wd_min'), 'alert');
            return
        }
        if (amt > avail()) {
            toast('Max: ' + money(avail()), 'alert');
            return
        }
        if (!holder || holder.toLowerCase() !== me().name.toLowerCase()) {
            toast(t('p_holder') + ' ' + t('wd_name_err') + ' "' + me().name + '"', 'alert');
            return
        }
        if (!acc) {
            toast(t('err_name'), 'alert');
            return
        }
        if (!$('#wdOwn').checked) {
            toast(t('wd_own'), 'alert');
            return
        }
        if (!wdShotD) {
            toast(t('wd_shot'), 'alert');
            return
        }
        me().payout = {
            bank,
            acc,
            holder
        };
        const btn = $('#wdGo');
        btn.disabled = true;
        btn.innerHTML = ic('bot') + esc(t('processing'));
        setTimeout( () => {
            S.withdrawn = (S.withdrawn || 0) + amt;
            S.wds.unshift({
                amt,
                method: mth,
                bank,
                acc,
                holder,
                shot: wdShotD,
                ts: Date.now()
            });
            save();
            closeModal();
            toast(t('wd_ok') + ' — ' + money(amt) + ' (' + locMoney(amt, ct) + ')', 'wallet');
            setTimeout( () => toast(t('wd_72'), 'zap'), 1200);
            renderProfile()
        }
        , 1600);
    }
    ;
}
function pickShot() {
    const inp = $('#fin');
    inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            const sc = Math.min(1, 360 / img.width);
            c.width = img.width * sc;
            c.height = img.height * sc;
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            wdShotD = c.toDataURL('image/jpeg', 0.8);
            const pv = $('#wdShotPrev');
            if (pv)
                pv.innerHTML = `<img src="${wdShotD}" style="max-height:90px;border-radius:8px;border:1px solid var(--line)">`
        }
        ;
        img.src = URL.createObjectURL(f)
    }
    ;
    inp.click();
}

/* ================= moderation ================= */
function spongeBlock(host) {
    host = host || $('#composer');
    if (host) {
        const o = document.createElement('div');
        o.className = 'sponge-ovl';
        o.innerHTML = `<div class="sblob">${ic('eyeoff', 'width:30px;height:30px')}</div>`;
        host.appendChild(o);
        setTimeout( () => o.remove(), 950)
    }
    if (me()) {
        me().strikes = (me().strikes || 0) + 1;
        save()
    }
    toast(t('spam_n') + ': ' + t('blocked_note'), 'alert');
    setTimeout( () => toast(t('email_sent'), 'send'), 900);
}
function inkFlood(x, y) {
    const b = document.createElement('div');
    b.className = 'blob';
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    document.body.appendChild(b);
    b.addEventListener('animationend', () => b.remove())
}

/* ================= publish / media ================= */
function publish() {
    const ta = $('#compTa')
      , text = ((ta && ta.value) || draftText || '').trim();
    if (!text && !draftMedia.length) {
        const c = $('#composer');
        c.classList.add('shake');
        setTimeout( () => c.classList.remove('shake'), 450);
        return
    }
    if (BAD_RE.test(text) || linkBad(text)) {
        spongeBlock($('#composer'));
        draftText = '';
        refreshComposer();
        return
    }
    if (!draftEmo) {
        $('#emoHint').style.display = 'block';
        $('#emoPick').classList.add('shake');
        setTimeout( () => $('#emoPick').classList.remove('shake'), 450);
        return
    }
    const r = mulberry(hashStr(text + Date.now()));
    const total = 60 + Math.round(r() * 160)
      , by = {}
      , byAge = {};
    let left = total
      , la = total;
    const keys = Object.keys(CTRY);
    for (let i = 0; i < 7; i++) {
        const c = keys[Math.floor(r() * keys.length)];
        const v = i === 6 ? Math.max(0, left) : Math.round(total * (0.05 + r() * 0.2));
        by[c] = (by[c] || 0) + v;
        left -= v
    }
    AGEK.forEach( (a, i) => {
        byAge[a] = i === AGEK.length - 1 ? Math.max(0, la) : Math.round(total * AGEW[i] * (0.85 + r() * 0.3));
        la -= byAge[a]
    }
    );
    S.posts.unshift({
        id: uid(),
        author: 'me',
        anon: me().defAnon || draftAnon,
        emotion: draftEmo,
        text,
        media: [...draftMedia],
        ts: Date.now(),
        likes: [],
        shares: 0,
        comments: [],
        reads: {
            total,
            by,
            byAge
        },
        ugid: (view === 'ugroup' ? viewState.gid : undefined)
    });
    draftMedia = [];
    draftEmo = null;
    draftAnon = false;
    draftText = '';
    save();
    pushRemote(S.posts[0]);
    scheduleEngagement(S.posts[0]);
    const pub = $('[data-act="publish"]');
    if (pub) {
        const rect = pub.getBoundingClientRect();
        inkFlood(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
    if (view === 'ugroup')
        openUGroup(viewState.gid);
    else
        setTimeout( () => {
            renderFeed();
            toast(t('pub_ok'), 'check')
        }
        , 380);
}
function pickMedia(kind) {
    const inp = $('#fin');
    inp.accept = kind === 'img' ? 'image/*' : kind === 'aud' ? 'audio/*' : 'video/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const done = () => {
            const cm = $('#compMedia');
            if (cm)
                cm.innerHTML = draftMedia.map( (m, i) => mediaPreview(m, i)).join('')
        }
        ;
        if (kind === 'img') {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                const sc = Math.min(1, 1000 / Math.max(img.width, img.height));
                c.width = img.width * sc;
                c.height = img.height * sc;
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                draftMedia.push({
                    type: 'image',
                    url: c.toDataURL('image/jpeg', 0.82)
                });
                done()
            }
            ;
            img.src = URL.createObjectURL(f);
        } else {
            if (f.size <= 2.3e6) {
                const rd = new FileReader();
                rd.onload = () => {
                    draftMedia.push({
                        type: kind === 'aud' ? 'audio' : 'video',
                        url: rd.result
                    });
                    done()
                }
                ;
                rd.readAsDataURL(f)
            } else {
                draftMedia.push({
                    type: kind === 'aud' ? 'audio' : 'video',
                    url: URL.createObjectURL(f),
                    sess: true
                });
                toast(t('large_file'), 'alert');
                done()
            }
        }
    }
    ;
    inp.click();
}
function pickAvatar() {
    const inp = $('#fin');
    inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = c.height = 240;
            const s = Math.min(img.width, img.height);
            c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 240, 240);
            me().photo = c.toDataURL('image/jpeg', 0.85);
            save();
            renderProfile()
        }
        ;
        img.src = URL.createObjectURL(f)
    }
    ;
    inp.click()
}
function pickCover() {
    const inp = $('#fin');
    inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = 1200;
            c.height = 400;
            const s = Math.max(1200 / img.width, 400 / img.height);
            const sw = 1200 / s
              , sh = 400 / s;
            c.getContext('2d').drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, 1200, 400);
            me().cover = {
                type: 'img',
                url: c.toDataURL('image/jpeg', 0.82)
            };
            save();
            closeModal();
            renderProfile();
            toast(t('saved'), 'check');
        }
        ;
        img.src = URL.createObjectURL(f);
    }
    ;
    inp.click();
}
function pickLogo() {
    const inp = $('#fin');
    inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = 200;
            c.height = 64;
            const s = Math.max(200 / img.width, 64 / img.height);
            const sw = 200 / s
              , sh = 64 / s;
            c.getContext('2d').drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, 200, 64);
            S.logo = c.toDataURL('image/jpeg', 0.85);
            save();
            renderHeader();
            closeModal();
            toast(t('logo_ok'), 'check')
        }
        ;
        img.src = URL.createObjectURL(f)
    }
    ;
    inp.click();
}
function openCoverModal() {
    const u = me();
    if (!u)
        return;
    modal(`<h3>${ic('img')} ${esc(t('s_cover'))}</h3><p class="sub">${esc(t('tagline'))}</p>
   <button class="btn" style="width:100%;justify-content:center" data-act="coverUp">${ic('img')}${esc(t('c_upload'))}</button>
   <h5 class="panelab" style="margin:18px 0 10px">PRESETS — ${esc(t('s_color'))}</h5>
   <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
     <button class="cp ${!u.cover ? 'on' : ''}" data-act="coverPreset" data-css="SOLID" style="background:${u.color}" title="${esc(t('s_color'))}">${ic('user')}</button>
     ${COVERS.map( (c, i) => `<button class="cp ${u.cover && u.cover.type === 'css' && u.cover.css === c ? 'on' : ''}" data-act="coverPreset" data-css="${i}" style="background:${c}"></button>`).join('')}
   </div>
   ${u.cover ? `<button class="btn ghost sm" style="margin-top:16px" data-act="coverRm">${ic('trash')}${esc(t('c_remove'))}</button>` : ''}`);
}

/* ================= dark / notif / trending / mic ================= */
function applyDark() {
    document.body.classList.toggle('dark', !!S.dark)
}
function addNotif(text, icn2) {
    S.notifs = S.notifs || [];
    S.notifs.unshift({
        id: uid(),
        icn: icn2 || 'bell',
        text,
        ts: Date.now(),
        read: false
    });
    save();
    renderHeader()
}
function toggleNotifs() {
    const p = $('#notifPanel');
    if (!p)
        return;
    if (p.classList.contains('open')) {
        p.classList.remove('open');
        return
    }
    renderBellPanel();
    p.classList.add('open')
}
function renderBellPanel() {
    const p = $('#notifPanel');
    if (!p)
        return;
    p.innerHTML = `<div class="np-h"><b>${esc(t('notif_t'))}</b><button class="pact" data-act="markRead">${esc(t('mark_read'))}</button></div>
 <div class="np-list">${(S.notifs || []).length ? S.notifs.slice(0, 20).map(n => `<div class="np-row ${n.read ? '' : 'un'}">${ic(n.icn || 'bell')}<div><span>${esc(n.text)}</span><span class="mono">${timeAgo(n.ts)}</span></div></div>`).join('') : `<p class="np-empty">${esc(t('no_notif'))}</p>`}</div>`;
    S.notifs.forEach(n => n.read = true);
    save();
    renderHeader()
}
function trendingTags() {
    const m = {};
    S.posts.forEach(p => {
        const add = k => {
            if (k)
                m[k] = (m[k] || 0) + 1
        }
        ;
        add(p.emotion);
        ((p.text || '').match(/#([\p{L}\p{N}_]+)/gu) || []).forEach(x => add(x.slice(1).toLowerCase()))
    }
    );
    return Object.entries(m).sort( (a, b) => b[1] - a[1]).slice(0, 7)
}
function scheduleEngagement(p) {
    const who = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
    setTimeout( () => {
        if (!S.posts.find(x => x.id === p.id))
            return;
        if (Math.random() < 0.5) {
            p.likes.push('fan_' + uid());
            addNotif(who.name + ' ' + t('n_like'), 'heart')
        } else {
            p.comments = p.comments || [];
            p.comments.push({
                id: uid(),
                by: who.id,
                anon: false,
                text: who.lines[Math.floor(Math.random() * who.lines.length)],
                ts: Date.now(),
                replies: []
            });
            addNotif(who.name + ' ' + t('n_comment'), 'cmt')
        }
        save();
        if (view === 'feed' || view === 'saved')
            renderView();
    }
    , 6000 + Math.random() * 10000);
}
let rec = null
  , recChunks = []
  , recTimerI = null
  , recSecs = 0;
async function recordVoice() {
    if (rec && rec.state === 'recording') {
        rec.stop();
        return
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        recChunks = [];
        rec = new MediaRecorder(stream);
        rec.ondataavailable = e => recChunks.push(e.data);
        rec.onstop = () => {
            clearInterval(recTimerI);
            stream.getTracks().forEach(tr => tr.stop());
            const blob = new Blob(recChunks,{
                type: rec.mimeType || 'audio/webm'
            });
            if (blob.size > 800) {
                draftMedia.push({
                    type: 'audio',
                    url: URL.createObjectURL(blob),
                    sess: true
                });
                toast(t('rec_ok') + ' (' + recSecs + 's)', 'mic')
            }
            recSecs = 0;
            const vb = $('#voiceBtn');
            if (vb)
                vb.classList.remove('rec');
            const rl = $('#recLbl');
            if (rl)
                rl.textContent = t('voice');
            refreshComposer();
        }
        ;
        rec.start();
        recSecs = 0;
        const vb = $('#voiceBtn');
        if (vb)
            vb.classList.add('rec');
        const rl = $('#recLbl');
        if (rl)
            rl.textContent = '● 0:00';
        recTimerI = setInterval( () => {
            recSecs++;
            const el = $('#recLbl');
            if (el)
                el.textContent = '● ' + Math.floor(recSecs / 60) + ':' + String(recSecs % 60).padStart(2, '0')
        }
        , 1000);
        toast(t('rec_now'), 'mic');
    } catch (e) {
        toast(t('rec_err'), 'alert')
    }
}



/* ================= Firebase (optional) ================= */
const FB_CONFIG = {
    apiKey: "AIzaSyCKbLYoN86Jt2BBtoIUvbxnmq17MxQ2rKs",
    authDomain: "autophagy-e8317.firebaseapp.com",
    projectId: "autophagy-e8317",
    appId: "1:531475817652:web:55007776d842273c8e63e1"
};
let FBDB = null;
async function initFirebase() {
    if (!FB_CONFIG.apiKey)
        return;
    try {
        await new Promise(r => {
            const s = document.createElement('script');
            s.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
            s.onload = r;
            s.onerror = r;
            document.head.appendChild(s)
        }
        );
        await new Promise(r => {
            const s = document.createElement('script');
            s.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
            s.onload = r;
            s.onerror = r;
            document.head.appendChild(s)
        }
        );
        if (!window.firebase)
            return;
        firebase.initializeApp(FB_CONFIG);
        FBDB = firebase.firestore();
        FBDB.collection('aposts').orderBy('ts', 'desc').limit(40).onSnapshot(snap => {
            S.remote = snap.docs.map(d => {
                const d2 = d.data();
                return {
                    id: d.id,
                    remote: true,
                    ts: d2.ts || 0,
                    text: d2.text || '',
                    emotion: d2.emotion || 'hope',
                    anon: !!d2.anon,
                    uname: d2.uname,
                    uct: d2.uct,
                    likes: d2.likes || 0,
                    shares: 0,
                    comments: [],
                    media: d2.media || [],
                    reads: {
                        total: d2.reads || 0,
                        by: {},
                        byAge: {}
                    }
                }
            }
            );
            if (view === 'feed')
                renderFeed();
        }
        );
        console.log('🔥 Autophagy global feed ON');
    } catch (e) {
        console.warn('Firebase off', e)
    }
}
async function pushRemote(p) {
    if (!FBDB)
        return;
    try {
        const media = (p.media || []).filter(m => m.type === 'image' && m.url && m.url.length < 600000).map(m => ({
            type: 'image',
            url: m.url
        }));
        await FBDB.collection('aposts').add({
            text: p.text || '',
            emotion: p.emotion,
            anon: p.anon,
            uname: p.anon ? '' : me().name,
            uct: me().ct,
            ts: Date.now(),
            likes: 0,
            media
        });
    } catch (e) {}
}

/* ================= Google Translate ================= */
let gtLoaded = false;
function loadGTScript() {
    if (gtLoaded)
        return;
    gtLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=gtReady';
    s.onerror = () => {
        const d = $('#gtSlot');
        if (d)
            d.innerHTML = '<p style="font-size:12.5px;color:var(--mut)">⚠️ Google Translate could not load (offline?).</p>'
    }
    ;
    document.head.appendChild(s);
}
function gtReady() {
    const slot = $('#gtSlot');
    if (slot && !slot.childElementCount) {
        try {
            new google.translate.TranslateElement({
                pageLanguage: 'auto',
                autoDisplay: false,
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
            },'google_translate_element')
        } catch (e) {}
    }
}
function mountGT() {
    loadGTScript();
    const slot = $('#gtSlot');
    if (!slot)
        return;
    if (!slot.childElementCount)
        slot.innerHTML = '<div id="google_translate_element"></div>';
    let tries = 20;
    const wait = () => {
        if (window.google && google.translate && google.translate.TranslateElement) {
            try {
                new google.translate.TranslateElement({
                    pageLanguage: 'auto',
                    autoDisplay: false,
                    layout: google.translate.TranslateElement.InlineLayout.SIMPLE
                },'google_translate_element')
            } catch (e) {}
        } else if (tries-- > 0)
            setTimeout(wait, 300);
    }
    ;
    wait();
}
function gtActive() {
    try {
        const m = document.cookie.match(/googtrans=\/[a-z-]+\/([a-z-]+)/i);
        return m ? m[1] : null
    } catch (e) {
        return null
    }
}

/* ================= Avo chatbot ================= */
const BRIDGE = {
    zh: '我还在学中文，先用英文回答：',
    ja: '日本語は勉強中です。まずは英語で：',
    ko: '한국어를 배우는 중이에요. 영어로 답할게요: ',
    pt: 'Ainda aprendo português — por ora em inglês: ',
    de: 'Ich lerne noch Deutsch — vorerst auf Englisch: ',
    ru: 'Я ещё учу русский — пока по-английски: ',
    tr: 'Türkçe öğreniyorum — şimdilik İngilizce: ',
    id: 'Masih belajar bahasa Indonesia — untuk sementara dalam bahasa Inggris: ',
    it: 'Sto imparando l’italiano — per ora in inglese: '
};
const KB = {
    greet: {
        en: 'Hello — I’m Avo. Ask about posting, anonymity, earnings, withdrawal, ads, Earn Zone, groups, repost or translation — in your own language.',
        bn: 'হ্যালো — আমি আভো। পোস্টিং, নাম গোপন, আয়, উত্তোলন, বিজ্ঞাপন, আর্ন জোন, গ্রুপ, শেয়ার বা অনুবাদ নিয়ে জিজ্ঞাসা করো — তোমার ভাষায়।',
        es: 'Hola — soy Avo.',
        fr: 'Bonjour — je suis Avo.',
        ar: 'مرحبًا — أنا آفو.',
        hi: 'नमस्ते — मैं एवो हूँ।'
    },
    tr: {
        en: 'Tap 🌐 on any post to read it in your language — works for every language: English, Bengali, Persian, Hindi, Arabic, Italian, Spanish and 100+ more.',
        bn: 'যেকোনো পোস্টে 🌐 চাপলে সেটা আপনার ভাষায় পড়া যাবে — ইংরেজি, বাংলা, ফার্সি, হিন্দি, আরবি, ইতালি, স্প্যানিশসহ ১০০+ ভাষায়।',
        es: 'Toca 🌐 en cualquier publicación.',
        fr: 'Touchez 🌐 sur une publication.',
        ar: 'اضغط 🌐 على أي منشور.',
        hi: 'किसी भी पोस्ट पर 🌐 दबाएँ।'
    },
    az: {
        en: '💰 Earn Zone: share your Adsterra, Monetag, TerraBox, AdSense or Google Ad Link — other users click and the network pays you directly. Autophagy keeps only a 5% commission.',
        bn: '💰 আর্ন জোন: আপনার Adsterra, Monetag, TerraBox, AdSense বা Google Ad Link শেয়ার করুন — অন্য ইউজার ক্লিক করলেই নেটওয়ার্ক সরাসরি আপনাকে পে করবে। অটোফজি রাখবে মাত্র ৫% কমিশন।',
        es: 'Zona de ganancias; 5% de comisión.',
        fr: 'Zone de gains ; commission de 5 %.',
        ar: 'منطقة الكسب؛ عمولة ٥٪.',
        hi: 'अर्न ज़ोन; 5% कमीशन।'
    },
    ads: {
        en: 'Ads run in 4 places: Feed slider (×1.0), Header strip (×1.2), Footer strip (×1.2) and site-wide Pop-ups (×1.5). Pay to Autophagy PLC — bank, or bKash Merchant / Nagad / Rocket +8801722616040 — then submit TRX + screenshot.',
        bn: 'বিজ্ঞাপন ৪ জায়গায় চলে। পেমেন্ট করুন অটোফজি পিএলসি — ব্যাংক অথবা বিকাশ মার্চেন্ট / নগদ / রকেট +8801722616040 — তারপর TRX + স্ক্রিনশট জমা দিন।',
        es: 'Anuncios en 4 lugares.',
        fr: 'Annonces en 4 emplacements.',
        ar: 'الإعلانات في ٤ أماكن.',
        hi: 'विज्ञापन 4 स्थानों पर।'
    },
    post: {
        en: 'Tap “Write openly”, pick a topic, add photo/voice/video, add #hashtags — then publish. Anonymous with one tap. News & social links are welcome.',
        bn: '“মন খুলে লেখো”-তে লেখো, বিষয় বাছো, ছবি-কণ্ঠ-ভিডিও যোগ করো, #হ্যাশট্যাগ দাও — তারপর প্রকাশ। নিউজ লিংক চলবে।',
        es: 'Toca «Escribir abiertamente», elige un tema, añade foto/voz/vídeo y publica.',
        fr: 'Touchez « Écrire ouvertement », choisissez un thème, ajoutez photo/voix/vidéo — publiez.',
        ar: 'اضغط «اكتب بصراحة»، اختر موضوعًا، أضف صورة/صوت/فيديو — ثم انشر.',
        hi: '«खुलकर लिखो» दबाओ, विषय चुनो, तस्वीर/आवाज़/वीडियो जोड़ो — प्रकाशित करो।'
    },
    anon: {
        en: 'Switch on “Anonymous” before publishing — your name and photo are replaced.',
        bn: 'প্রকাশের আগে “নাম গোপন” চালু করো — নাম-ছবি সরে যাবে।',
        es: 'Activa «Anónimo» antes de publicar.',
        fr: 'Activez « Anonyme » avant de publier.',
        ar: 'فعّل «مجهول» قبل النشر.',
        hi: 'प्रकाशित करने से पहले «गुमनाम» चालू करो।'
    },
    earn: {
        en: 'Every post earns from reads, likes, shares. Autophagy keeps 20%; 80% is yours — shown in USD and your country’s currency.',
        bn: 'প্রতিটি পোস্ট আয় করে। অটোফেজি ২০%, বাকি ৮০% তোমার — ডলার ও তোমার দেশের মুদ্রায় দেখো।',
        es: 'Cada publicación gana. Autophagy guarda el 20%.',
        fr: 'Chaque publication rapporte. Autophagy garde 20 %.',
        ar: 'كل منشور يكسب. أوتوفاجي يأخذ ٢٠٪.',
        hi: 'हर पोस्ट कमाती है। ऑटोफेजी 20% रखता है।'
    },
    wd: {
        en: 'Profile → Earnings → Withdraw: own-name bank account required, upload earnings screenshot, and money reaches you within 72 hours in your currency.',
        bn: 'প্রোফাইল → আয় → উত্তোলন: নিজের নামে ব্যাংক একাউন্ট, স্ক্রিনশট — ৭২ ঘণ্টায় টাকা।',
        es: 'Perfil → Ingresos → Retirar: cuenta propia, captura, 72 horas.',
        fr: 'Profil → Revenus → Retirer : compte à votre nom, capture, 72 h.',
        ar: 'الملف ← الأرباح ← سحب: حساب باسمك، لقطة شاشة، ٧٢ ساعة.',
        hi: 'प्रोफ़ाइल → कमाई → निकालें: अपने नाम का खाता, स्क्रीनशॉट, 72 घंटे।'
    },
    grp: {
        en: 'Create your own group from the Friend Search Box (+ Create a group). Members join, see all group content, post inside, and share Earn Zone links to earn more.',
        bn: 'ফ্রেন্ড সার্চ বক্স থেকে (+ গ্রুপ খুলুন) নিজের গ্রুপ খোলো। সদস্য যোগ হবে, গ্রুপের সব কন্টেন্ট দেখবে, গ্রুপে পোস্ট দেবে, আর আর্ন জোনের লিংক শেয়ার করে বেশি আয় করবে।',
        es: 'Crea tu grupo desde el buscador.',
        fr: 'Créez votre groupe.',
        ar: 'أنشئ مجموعتك.',
        hi: 'ग्रुप बनाओ।'
    },
    msg: {
        en: 'Open Messages from the side rail — SMS-style chat with writers you follow.',
        bn: 'পাশের রেল থেকে মেসেজ খোলো — ফলো করা লেখকদের সাথে SMS-স্টাইল চ্যাট।',
        es: 'Abre Mensajes.',
        fr: 'Ouvrez Messages.',
        ar: 'افتح الرسائل.',
        hi: 'साइड रेल से संदेश खोलो।'
    },
    safe: {
        en: 'SHA-256 hashed passwords, rotating 2FA codes, encrypted sessions with 12h timeout, login-attempt lockout (5 fails → 2 min lock), and instant spam/gore/sexual-link sponging. Nothing sensitive is stored in plain text.',
        bn: 'SHA-256 হ্যাশ পাসওয়ার্ড, ঘূর্ণায়মান 2FA কোড, ১২ ঘণ্টার সেশন-টাইমআউট, ৫ বার ভুলে ২ মিনিট লক, আর তাৎক্ষণিক স্প্যাম/রক্তাক্ত/যৌন-লিংক স্পঞ্জ। কোনো সংবেদনশীল তথ্য প্লেইন টেক্সটে নেই।',
        es: 'SHA-256, 2FA, sesiones con tiempo límite.',
        fr: 'SHA-256, 2FA, sessions limitées.',
        ar: 'SHA-256، 2FA، جلسات مؤقتة.',
        hi: 'SHA-256, 2FA, सेशन टाइमआउट।'
    },
    del: {
        en: 'Every post, comment, photo, voice note or video has a delete option.',
        bn: 'প্রতিটি পোস্ট, মন্তব্য, ছবি, কণ্ঠ বা ভিডিওতে ডিলিট অপশন আছে।',
        es: 'Todo tiene opción de eliminar.',
        fr: 'Tout a une option supprimer.',
        ar: 'لكل شيء خيار حذف.',
        hi: 'सब पर हटाने का विकल्प।'
    },
    who: {
        en: 'I’m Avo — the guide of Autophagy. I speak many languages, answer instantly, and never sleep. WhatsApp bot: +8801671451195.',
        bn: 'আমি আভো — অটোফেজির গাইড। অনেক ভাষা বলি, সঙ্গে সঙ্গে উত্তর দিই, ঘুমাই না। হোয়াটসঅ্যাপ বট: +8801671451195।',
        es: 'Soy Avo.',
        fr: 'Je suis Avo.',
        ar: 'أنا آفو.',
        hi: 'मैं एवो।'
    },
    thanks: {
        en: 'You’re welcome. Keep saying everything openly.',
        bn: 'স্বাগতম। সব কথা খুলে বলতে থাকো।',
        es: 'De nada.',
        fr: 'Avec plaisir.',
        ar: 'على الرحب.',
        hi: 'स्वागत है।'
    },
    dflt: {
        en: 'I’m still learning that one. Try: posting, translation, repost, anonymity, earnings, withdrawal, ads, Earn Zone, groups, security.',
        bn: 'এটা এখনো শিখছি। জিজ্ঞাসা করো: পোস্টিং, অনুবাদ, শেয়ার, নাম গোপন, আয়, উত্তোলন, বিজ্ঞাপন, আর্ন জোন, গ্রুপ, নিরাপত্তা।',
        es: 'Estoy aprendiendo.',
        fr: 'J’apprends encore.',
        ar: 'ما زلت أتعلم.',
        hi: 'अभी सीख रही हूँ।'
    },
};
const INTENTS = [['tr', /translat|translate|ভাষা.*পড়|অনুবাদ|🌐|भाषा.*पढ़|traduc|traduire|ترجم|翻译/i], ['az', /earn zone|adsterra|monetag|terrabox|ad ?link|আর্ন জোন|adsterra|monetag/i], ['ads', /advertis|\bads?\b|banner|placard|photocard|poster|popup|pop-up|header|footer|trx|slider|rate|price|duration|bkash|nagad|rocket|বিকাশ|নগদ|রকেট|বিজ্ঞাপ|মেয়াদ|দাম|إعلان|广告|publi|werb|reklam/i], ['grp', /group|গ্রুপ|समूह|مجموع|群|grupo|gruppe|grup/i], ['anon', /anon|গোপন|مجهول|匿名|hide.*name|nombre|adı/i], ['wd', /withdraw|payout|উত্তোলন|निकाल|سحب|提现|retir|abheben|sacar|tarik/i], ['earn', /earn|income|money|আয়|টাকা|কমাঈ|أرباح|赚|dinero|argent|geld/i], ['del', /delet|remove|মুছ|হটা|حذف|删除|supprim|löschen/i], ['msg', /message|chat|মেসেজ|সনেশ|رسال|消息|mensaje|nachricht/i], ['follow', /follow|repost|friend|ফলো|শেয়ার.*কন্টেন্ট|বন্ধু|फ़ॉलो|متابع|关注|segui|abonn/i], ['safe', /secur|hack|password|lock|নিরাপত্ত|পাসওয়ার্ড|লক|पासवर्ड|लॉक|أمان|安全|segur/i], ['post', /post|publish|write|upload|poem|story|travel|music|book|heritage|পোস্ট|লেখ|কবিত|গল্প|ভ্রমণ|সংগী|লিখ|कविता|منشر|اكتب|发|写|publier|schreiben/i], ['who', /who are you|তুমি কে|কৌন হো|من أنت|你是谁|qui es|wer bist/i], ['greet', /^(hi|hello|hey)\b|hola|bonjour|hallo|merhaba|সালাম|হ্যালো|নমস্কার|নমস্তে|سلام|مرحب|你好|こんにちは|안녕/i], ['thanks', /thank|ধন্যবাদ|शुक्रियা|شكرا|谢谢|gracias|merci|danke/i], ];
function detectScript(q) {
    if (/[\u0980-\u09FF]/.test(q))
        return 'bn';
    if (/[\u0900-\u097F]/.test(q))
        return 'hi';
    if (/[\u0600-\u06FF]/.test(q))
        return 'ar';
    if (/[\u4E00-\u9FFF]/.test(q))
        return 'zh';
    if (/[\u3040-\u30FF]/.test(q))
        return 'ja';
    if (/[\uAC00-\uD7AF]/.test(q))
        return 'ko';
    return null;
}
function avoAnswer(q) {
    const script = detectScript(q);
    const kw = {
        es: ['hola', 'publicar', 'dinero', 'retirar', 'gracias', 'anunci', 'grup', 'mensaje', 'precio'],
        fr: ['bonjour', 'publier', 'argent', 'retirer', 'merci', 'annonce', 'groupe', 'message', 'tarif'],
        pt: ['ola', 'olá', 'publicar', 'dinheiro', 'sacar', 'obrigad', 'anúnci', 'mensagem', 'preço'],
        de: ['hallo', 'veröffentlichen', 'geld', 'abheben', 'danke', 'werb', 'gruppe', 'nachricht', 'preis'],
        id: ['halo', 'posting', 'uang', 'tarik', 'terima', 'iklan', 'grup', 'pesan', 'harga'],
        tr: ['merhaba', 'gönderi', 'para', 'çekmek', 'teşekkür', 'reklam', 'mesaj', 'fiyat']
    };
    let lang = null
      , bs = 0;
    for (const [k,arr] of Object.entries(kw)) {
        const s = arr.filter(w => q.toLowerCase().includes(w)).length;
        if (s > bs) {
            bs = s;
            lang = k
        }
    }
    if (script && (KB.greet[script] || BRIDGE[script]))
        lang = script;
    const eff = lang && KB.greet[lang] ? lang : 'en';
    let intent = 'dflt';
    for (const [k,re] of INTENTS) {
        if (re.test(q)) {
            intent = k;
            break
        }
    }
    let ans = KB[intent][eff] || KB[intent].en;
    if (eff !== 'en' && !KB[intent][eff])
        ans = (BRIDGE[eff] || '') + ans;
    return ans;
}
function avoPush(txt, who) {
    const log = $('#avoLog');
    if (!log)
        return;
    const el = document.createElement('div');
    el.className = 'bub ' + (who === 'me' ? 'me' : 'you');
    el.textContent = txt;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight
}
function avoTyping(on) {
    let e = $('#avoTyp');
    if (on && !e) {
        e = document.createElement('div');
        e.className = 'bub you typing';
        e.id = 'avoTyp';
        e.innerHTML = '<i></i><i></i><i></i>';
        $('#avoLog').appendChild(e);
        $('#avoLog').scrollTop = 1e6
    }
    if (!on && e)
        e.remove()
}
function avoSend() {
    const inp = $('#avoIn')
      , v = inp.value.trim();
    if (!v)
        return;
    inp.value = '';
    avoPush(v, 'me');
    avoTyping(true);
    setTimeout( () => {
        avoTyping(false);
        avoPush(avoAnswer(v))
    }
    , 700 + Math.random() * 700);
}
function avoAnswerIntent(k) {
    const eff = KB.greet[S.lang] ? S.lang : 'en';
    return KB[k][eff] || KB[k].en
}
function avoToggle(open) {
    avoOpen = open === undefined ? !avoOpen : open;
    $('#avo').classList.toggle('open', avoOpen);
    if (avoOpen && !avoSeeded) {
        avoSeeded = true;
        avoPush(t('chat_g'));
        $('#avoChips').innerHTML = ['post', 'tr', 'az', 'ads', 'grp', 'earn', 'wd', 'safe'].map(k => `<button data-act="avoChip" data-k="${k}">${esc(t(k === 'wd' ? 'withdraw' : k === 'post' ? 'hero_cta' : k === 'earn' ? 't_earnings' : k === 'az' ? 'az_t' : k === 'ads' ? 'advertise' : k === 'tr' ? 'tr_tip' : 't_security'))}</button>`).join('')
    }
}

/* ================= about / help ================= */
function openAbout() {
    const A = S.about;
    modal(`<h3>🏛️ ${esc(t('about_t'))}</h3><p class="sub">Autophagy — ${esc(t('tagline'))}</p>
   ${A.img ? `<img src="${A.img}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 12px;display:block;border:3px solid var(--blue)">` : ''}
   <h3 style="text-align:center;font-size:19px">${esc(A.name)}</h3>
   <p style="font-size:14.5px;margin-top:10px;white-space:pre-line">${esc(A.text || '')}</p>
   <p class="mono" style="text-align:center;margin-top:10px">🌐 ${esc(location.host || 'autophagy.app')}</p>
   ${adminMode ? `<div class="adcard" style="margin-top:16px"><span class="tag">✏️ EDIT (Authority)</span>
     <div class="field"><label>${esc(t('ph_name'))}</label><input id="abName" value="${esc(A.name)}"></div>
     <div class="azfield"><button class="btn ghost sm" data-act="abImg" type="button">${ic('img')}${esc(t('az_img_pick'))}</button><div id="abImgPrev" style="margin-top:8px">${A.img ? `<img src="${A.img}" style="max-height:70px;border-radius:8px">` : ''}</div></div>
     <div class="azfield"><textarea id="abText" placeholder="${esc(t('about_ph'))}" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;min-height:80px">${esc(A.text || '')}</textarea></div>
     <button class="btn sm" data-act="abSave">${esc(t('save'))}</button></div>` : ''}`);
}
function pickAbImg() {
    const inp = $('#fin');
    inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f)
            return;
        inp.value = '';
        const im = new Image();
        im.onload = () => {
            const c = document.createElement('canvas');
            c.width = c.height = 240;
            const s = Math.min(im.width, im.height);
            c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 240, 240);
            abImgData = c.toDataURL('image/jpeg', 0.85);
            const pv = $('#abImgPrev');
            if (pv)
                pv.innerHTML = `<img src="${abImgData}" style="max-height:80px;border-radius:8px">`
        }
        ;
        im.src = URL.createObjectURL(f)
    }
    ;
    inp.click()
}
function openHelp() {
    const d = DOCS.help;
    modal(`<h3>🆘 ${esc(t('help_t'))}</h3><p class="sub">Autophagy — ${esc(t('tagline'))}</p><p style="font-size:14.5px;white-space:pre-line;line-height:1.9">${esc(d)}</p>
   <div style="margin-top:14px"><a class="btn" href="mailto:tautophagy@gmail.com">📧 Email</a> <a class="btn ghost" href="https://wa.me/8801671451195" target="_blank" rel="noopener">💬 WhatsApp</a></div>`);
}

/* ================= docs ================= */
const DOCS = {
    privacy: ['Autophagy collects only what it needs: name, handle, country, hashed password and your content. Passwords are stored only as SHA-256 hashes. Deleting a post removes it permanently. Sessions auto-expire after 12 hours; 5 failed logins lock the account for 2 minutes. We never sell your data; NID name and contact are used only for payout verification; uploaded selfies are stored for verification only and deletable on request; deleted accounts are purged within 30 days.', 'আমরা শুধু দরকারি জিনিসই রাখি। পাসওয়ার্ড শুধু SHA-256 হ্যাশ হিসেবে থাকে। সেশন ১২ ঘণ্টা পরে অটো-শেষ; ৫ বার ভুল হলে ২ মিনিটের জন্য লক। আমরা কখনো তোমার ডেটা বিক্রি করি না; NID নাম ও যোগাযোগ শুধু পেআউট যাচাইয়ে ব্যবহৃত হয়; সেলফি শুধু ভেরিফিকেশনের জন্য থাকে, অনুরোধে মোছা যায়; মুছে ফেলা অ্যাকাউন্ট ৩০ দিনে সম্পূর্ণ মুছে যায়।'],
    terms: ['By using Autophagy you agree to speak openly but lawfully. Earnings: verified reads/likes/shares; Autophagy retains 20%, minimum withdrawal $10, paid within 72 hours. Ad pricing: base 3 days $15 … 1 year $900; placements ×1.0–×1.5. Payments: bank or bKash Merchant / Nagad / Rocket +8801722616040, verified via TRX ID. Earn Zone: ad-network links pay the owner directly; Autophagy collects a 5% commission at withdrawal — sent to Autophagy PLC, A/C 01345981024, Pubali Bank Dhaka 1200. The bank/gateway details may be updated by the authority when needed. Additional: users must be 13+; one account per person with real NID name; impersonation, fake TRX, self-click fraud and re-uploading others content without credit leads to strikes and account termination; ad payments are non-refundable once verified and live; disputed withdrawals are settled within 7 days with proof.', 'খোলা মেলা কিন্তু আইনের মধ্যে। আয়ের ২০% প্ল্যাটফর্ম ভাগ; ন্যূনতম $১০; ৭২ ঘণ্টায় পরিশোধ। পেমেন্ট: ব্যাংক অথবা বিকাশ মার্চেন্ট / নগদ / রকেট +8801722616040 — TRX দিয়ে যাচাই। আর্ন জোনে নেটওয়ার্ক সরাসরি লিংক-মালিককে পে করে; অটোফজি ৫% কমিশন কাটে — যায় অটোফজি পিএলসিতে, 013459810246, পূবালী ব্যাংক ঢাকা ১২০০। প্রয়োজনে কর্তৃপক্ষ ব্যাংক/গেটওয়ে তথ্য হালনাগাদ করতে পারে। অতিরিক্ত: বয়স ১৩+; প্রতি ব্যক্তি এক অ্যাকাউন্ট, NID-নামে; পরিচয় ভান, ভুয়া TRX, সেলফ-ক্লিক প্রতারণা ও অনুমতি ছাড়া অন্যের কন্টেন্ট পুনঃআপলোডে স্ট্রাইক ও অ্যাকাউন্ট বাতিল; যাচাই-লাইভ হওয়ার পর বিজ্ঞাপনের পেমেন্ট অফেরতযোগ্য; বিতর্কিত উত্তোলন প্রমাণসহ ৭ দিনে মীমাংসা।'],
    policy: ['Hate is not speech. Sexual links, gore/bloodshed, violence, religious attacks, false narratives and spam are sponged on sight — blocked, marked as scam, an email notice is sent, and a policy advertisement appears on the profile. News and social media links are welcome. Additional: no caste/religion/ethnic hate, no harassment or doxxing, no false health/financial claims, no impersonation of the Authority, no NSFW even in comments; repeated reposts without credit count as plagiarism; the Authority may remove content and strike accounts for any violation.', 'ঘৃণা নয়। যৌন লিংক, রক্তাক্ত/সহিংসতা, ধর্ম-আক্রমণ, মিথ্যা বয়ান ও স্প্যাম সঙ্গে সঙ্গে স্পঞ্জ — ইমেইল নোটিশ যায়। নিউজ ও সোশ্যাল লিংক স্বাগতম। অতিরিক্ত: জাত/ধর্ম/গোত্র-ঘৃণা, হয়রানি বা ব্যক্তিগত তথ্য-ফাঁস, ভুয়া স্বাস্থ্য/অর্থ দাবি, কর্তৃপক্ষের ছদ্মবেশ ও কমেন্টেও NSFW নিষিদ্ধ; কৃতিত্ব ছাড়া বারবার শেয়ার চুরি; কোনো লঙ্ঘনে কর্তৃপক্ষ কন্টেন্ট সরিয়ে অ্যাকাউন্টে স্ট্রাইক দিতে পারে।'],
    help: '১) একাউন্ট: Join Autophagy → NID-নাম + মোবাইল/ইমেইল + পাসওয়ার্ড (৮+) → সেলফি দিয়ে ভেরিফাই।\n২) আয়: প্রতিটি পোস্ট পাঠ-লাইক-শেয়ার থেকে আয় করে (অটোফজি ২০%, তোমার ৮০%); Earn Zone-এ অ্যাড-লিংক শেয়ার করলে ৯.৫% কমিশন ছাড়া বাকিটা তোমার; গ্রুপেও লিংক শেয়ার করা যায়।\n৩) উত্তোলন: প্রোফাইল → আয় → উত্তোলন — নিজের নামে ব্যাংক একাউন্ট + স্ক্রিনশট → ৭২ ঘণ্টায় টাকা।\n৪) বিজ্ঞাপন: Advertise → ফাইল + মেয়াদ + অবস্থান → বিকাশ/নগদ/রকেট +8801722616040 বা ব্যাংকে পেমেন্ট → TRX+স্ক্রিনশট → কর্তৃপক্ষ যাচাই করলেই লাইভ।\n৫) অনুবাদ: যেকোনো পোস্টের 🌐 চাপলে তোমার ভাষায় পড়া যাবে।\n৬) সমস্যা? ইমেইল বা WhatsApp-এ লেখো — ২৪ ঘণ্টায় উত্তর।',
};
function openDoc(k) {
    const d = DOCS[k] || DOCS.terms;
    modal(`<h3>${esc(k === 'policy' ? 'Content Policy' : k === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions')}</h3><p class="sub">Autophagy — ${esc(t('tagline'))}</p><p style="font-size:14.5px;margin-bottom:12px">${esc(d[0])}</p><p style="font-size:14px;color:var(--mut)">${esc(d[1])}</p>`);
}

/* ================= event delegation ================= */
document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]');
    const mp = $('#menuPanel');
    if (mp && !mp.contains(e.target) && !e.target.closest('#brand'))
        mp.classList.remove('open');
    const np = $('#notifPanel');
    if (np && !np.contains(e.target) && !e.target.closest('#bellBtn'))
        np.classList.remove('open');
    if (!e.target.closest('.hsearch')) {
        const tr = $('#tsRes');
        if (tr)
            tr.classList.remove('open')
    }
    if (!el)
        return;
    const act = el.dataset.act;
    try {
        switch (act) {
        case 'brand':
            toggleMenu();
            break;
        case 'spEnter':
            {
                $('#splash').classList.add('gone');
                applyI18n();
                renderHeader();
                renderView();
                break
            }
        case 'langToggle':
            langPanel();
            break;
        case 'setLang':
            setLang(el.dataset.lang);
            break;
        case 'm_login':
            openAuth('login');
            break;
        case 'm_join':
            openAuth('signup');
            break;
        case 'authTab':
            openAuth(el.dataset.m);
            break;
        case 'forgot':
            toast(t('reset_ok'), 'send');
            break;
        case 'demo':
            {
                if (!S.acct)
                    S.acct = {
                        handle: 'demo_voice',
                        pw: await sha256('demo12345'),
                        twoFA: false,
                        tfaSec: uid() + uid(),
                        pwScore: 16
                    };
                doLogin({
                    name: 'Demo Writer',
                    ct: 'BD',
                    pwScore: 16
                });
                break
            }
        case 'do2fa':
            {
                const c = $('#auCode').value.trim();
                if (await totp(S.acct.tfaSec) === c) {
                    resetFail();
                    doLogin()
                } else {
                    failLogin();
                    toast(t('err_code'), 'alert')
                }
                break
            }
        case 'm_logout':
            logout();
            break;
        case 'nav_profile':
            {
                if (!me())
                    return openAuth('login');
                view = 'profile';
                if (viewState.ptab === 'earnings' || viewState.ptab === 'security')
                    viewState.ptab = 'posts';
                renderView();
                toggleMenu(false);
                break
            }
        case 'nav_adzone':
            go('adzone');
            toggleMenu(false);
            break;
        case 'nav_msgs':
            requireAuth('msgs');
            toggleMenu(false);
            break;
        case 'nav_earn':
            requireAuth('earn');
            toggleMenu(false);
            break;
        case 'rail':
            {
                const acts = [ () => go('feed'), () => requireAuth('profile'), () => go('saved'), () => go('adzone'), () => requireAuth('msgs'), () => requireAuth('earn'), () => requireAuth('sec')];
                (acts[+el.dataset.i] || acts[0])();
                break
            }
        case 'tab':
            viewState.ptab = el.dataset.t;
            renderProfile();
            break;
        case 'heroWrite':
            {
                if (me()) {
                    go('feed');
                    setTimeout( () => {
                        const x = $('#compTa');
                        if (x)
                            x.focus()
                    }
                    , 300)
                } else
                    openAuth('signup');
                break
            }
        case 'emoF':
            activeEmo = el.dataset.e || null;
            renderFeed();
            break;
        case 'emo':
            draftEmo = el.dataset.e;
            refreshComposer();
            break;
        case 'anonT':
            draftAnon = !draftAnon;
            refreshComposer();
            break;
        case 'addm':
            pickMedia(el.dataset.m);
            break;
        case 'delm':
            draftMedia.splice(+el.dataset.i, 1);
            refreshComposer();
            break;
        case 'publish':
            publish();
            break;
        case 'pwEye':
            {
                const i = $('#auPw');
                if (i)
                    i.type = i.type === 'password' ? 'text' : 'password';
                break
            }
        case 'auSelfie':
            {
                const inp = $('#fin');
                inp.accept = 'image/*';
                inp.onchange = () => {
                    const f = inp.files[0];
                    if (!f)
                        return;
                    inp.value = '';
                    const im = new Image();
                    im.onload = () => {
                        const c = document.createElement('canvas');
                        c.width = c.height = 200;
                        const s = Math.min(im.width, im.height);
                        c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 200, 200);
                        S.pendSelfie = c.toDataURL('image/jpeg', 0.8);
                        const pv = $('#auSelfiePrev');
                        if (pv)
                            pv.innerHTML = `<img src="${S.pendSelfie}" style="max-height:80px;border-radius:50%">`
                    }
                    ;
                    im.src = URL.createObjectURL(f)
                }
                ;
                inp.click();
                break
            }
        case 'trPost':
            {
                const p = S.posts.find(x => x.id === el.dataset.id) || (S.remote || []).find(x => x.id === el.dataset.id);
                if (!p)
                    break;
                const txt = el.dataset.skip ? (p.comments || []).map(c => c.text).join('\n') || t('ph_comment') : (p.repostOf ? (p.rText || '') : (p.text || ''));
                window.open(trUrl(txt, S.lang), '_blank', 'noopener');
                break
            }
        case 'repost':
            {
                if (!me())
                    return openAuth('login');
                const p = S.posts.find(x => x.id === el.dataset.id) || (S.remote || []).find(x => x.id === el.dataset.id);
                if (!p)
                    break;
                const orig = p.remote ? (p.uname || 'Writer') : (p.author === 'me' ? me().name : (person(p.author)?.name || 'Writer'));
                const imgs = (p.media || []).filter(m => m.type === 'image').map(m => ({
                    type: 'image',
                    url: m.url
                }));
                S.posts.unshift({
                    id: uid(),
                    author: 'me',
                    anon: me().defAnon,
                    emotion: p.emotion,
                    repostOf: p.id,
                    rAuthor: orig,
                    rText: p.repostOf ? p.rText : p.text,
                    rMedia: imgs,
                    ts: Date.now(),
                    likes: [],
                    shares: 0,
                    comments: [],
                    reads: {
                        total: 25,
                        by: {
                            US: 5
                        },
                        byAge: {
                            '18-24': 10,
                            '25-34': 15
                        }
                    }
                });
                addNotif(orig + ' ' + t('n_repost'), 'repeat');
                toast(t('repost_ok'), 'repeat');
                save();
                renderView();
                break
            }
        case 'like':
            {
                const p = (S.remote || []).find(x => x.id === el.dataset.id) || S.posts.find(x => x.id === el.dataset.id);
                if (!p || !me())
                    break;
                if (p.remote) {
                    p.likes = (typeof p.likes === 'number' ? p.likes : 0) + 1;
                    if (FBDB)
                        FBDB.collection('aposts').doc(p.id).update({
                            likes: p.likes
                        }).catch( () => {}
                        );
                    renderView();
                    break
                }
                const i = p.likes.indexOf(me().id);
                if (i < 0)
                    p.likes.push(me().id);
                else
                    p.likes.splice(i, 1);
                save();
                renderView();
                break
            }
        case 'cmt':
            {
                openC.has(el.dataset.id) ? openC.delete(el.dataset.id) : openC.add(el.dataset.id);
                renderView();
                break
            }
        case 'share':
            {
                const p = S.posts.find(x => x.id === el.dataset.id) || (S.remote || []).find(x => x.id === el.dataset.id);
                if (!p)
                    break;
                p.shares = (p.shares || 0) + 1;
                save();
                const url = location.href.split('#')[0] + '#post-' + p.id;
                if (navigator.clipboard)
                    navigator.clipboard.writeText(url).catch( () => {}
                    );
                toast(t('share_ok'), 'share');
                renderView();
                break
            }
        case 'del':
            {
                const p = S.posts.find(x => x.id === el.dataset.id);
                if (!p)
                    break;
                confirmModal(t('del'), t('del_q'), t('yes'), () => {
                    S.posts = S.posts.filter(x => x.id !== p.id);
                    S.bookmarks = (S.bookmarks || []).filter(b => b !== p.id);
                    save();
                    toast(t('del_ok'), 'trash');
                    renderView()
                }
                );
                break
            }
        case 'ins':
            {
                const n = $('#ins-' + el.dataset.id);
                if (n)
                    n.classList.toggle('hidden');
                break
            }
        case 'replyT':
            {
                const c = el.dataset.c;
                replyTo.has(c) ? replyTo.delete(c) : replyTo.add(c);
                renderView();
                break
            }
        case 'csend':
            {
                const u = me();
                if (!u)
                    break;
                const p = S.posts.find(x => x.id === el.dataset.p) || (S.remote || []).find(x => x.id === el.dataset.p);
                if (!p)
                    break;
                const input = el.parentElement.querySelector('.ci');
                const v = input.value.trim();
                if (!v)
                    break;
                if (BAD_RE.test(v) || linkBad(v)) {
                    spongeBlock(el.closest('.post'));
                    break
                }
                p.comments = p.comments || [];
                const cmt = el.dataset.c ? p.comments.find(c => c.id === el.dataset.c) : null;
                const entry = {
                    id: uid(),
                    by: 'me',
                    anon: u.defAnon,
                    text: v,
                    ts: Date.now()
                };
                if (cmt) {
                    cmt.replies = cmt.replies || [];
                    cmt.replies.push(entry)
                } else
                    p.comments.push(entry);
                replyTo.delete(el.dataset.c || '');
                save();
                renderView();
                break
            }
        case 'cdel':
            {
                const p = S.posts.find(x => x.id === el.dataset.p);
                if (!p)
                    break;
                p.comments = (p.comments || []).filter(c => c.id !== el.dataset.c);
                save();
                renderView();
                break
            }
        case 'openP':
            {
                go('feed');
                setTimeout( () => {
                    const n = document.getElementById('post-' + el.dataset.id);
                    if (n) {
                        n.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        openC.add(el.dataset.id);
                        renderFeed()
                    }
                }
                , 200);
                break
            }
        case 'viewPerson':
            {
                if (!person(el.dataset.u))
                    break;
                closeModal();
                renderPersonProfile(el.dataset.u);
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                break
            }
        case 'backFeed':
            go('feed');
            break;
        case 'backProf':
            {
                view = 'profile';
                renderView();
                break
            }
        case 'pview':
            {
                viewState.pv = el.dataset.v;
                renderPView();
                break
            }
        case 'followP':
            {
                if (!me())
                    return openAuth('login');
                const id = el.dataset.u;
                const pp = person(id);
                const i = S.follows.indexOf(id);
                if (i < 0) {
                    S.follows.push(id);
                    toast((pp && pp.name || '') + ' — ' + t('following'), 'users');
                    setTimeout( () => {
                        if (!S.follows.includes(id) || S.back[id])
                            return;
                        S.back[id] = true;
                        if (me())
                            me().followers = (me().followers || 0) + 1;
                        save();
                        addNotif((pp && pp.name || '?') + ' ' + t('n_followback'), 'users');
                        if (view !== 'msgs')
                            renderView()
                    }
                    , 8000 + Math.random() * 9000);
                } else
                    S.follows.splice(i, 1);
                save();
                renderView();
                break
            }
        case 'openmsg':
            {
                if (!me())
                    return openAuth('login');
                curThread = el.dataset.u;
                closeModal();
                go('msgs');
                break
            }
        case 'tsJoin':
            {
                const g = GROUPS.find(x => x.id === el.dataset.g);
                if (!g)
                    break;
                const i = S.myGroups.indexOf(g.id);
                if (i < 0) {
                    S.myGroups.push(g.id);
                    toast(g.ic + ' ' + g.name + ' — ' + t('joined'), 'users')
                } else
                    S.myGroups.splice(i, 1);
                save();
                closeModal();
                const tr2 = $('#tsRes');
                if (tr2)
                    tr2.classList.remove('open');
                renderView();
                break
            }
        case 'grpOpen':
            {
                const g = GROUPS.find(x => x.id === el.dataset.g);
                if (!g)
                    break;
                if (!S.myGroups.includes(g.id))
                    S.myGroups.push(g.id);
                activeGroup = g.id;
                activeEmo = null;
                closeModal();
                save();
                go('feed');
                break
            }
        case 'grpExit':
            activeGroup = null;
            renderFeed();
            break;
        case 'gCreateOpen':
            closeModal();
            openGroupCreate();
            break;
        case 'gCreate':
            gCreate();
            break;
        case 'gJoin':
            {
                const g = (S.ugroups || []).find(x => x.id === el.dataset.id);
                if (!g)
                    break;
                const n = me() ? me().name : null;
                if (!n)
                    return openAuth('login');
                const i = g.members.indexOf(n);
                if (i < 0) {
                    g.members.push(n);
                    toast(g.name + ' — ' + t('joined'), 'users')
                } else
                    g.members.splice(i, 1);
                save();
                openUGroup(g.id);
                break
            }
        case 'openUG':
            openUGroup(el.dataset.id);
            break;
        case 'openAds':
            openAdModal();
            break;
        case 'adUpload':
            pickAdMedia();
            break;
        case 'adPay':
            adPayStep();
            break;
        case 'adPaid2':
            adPaidStep();
            break;
        case 'apShot':
            pickApShot();
            break;
        case 'adDone':
            {
                if (!adTemp)
                    break;
                const trxI = $('#apTrx');
                const trx = trxI ? trxI.value.trim() : '';
                if (!trx) {
                    toast(t('p_trx') + ' — ⚠️', 'alert');
                    break
                }
                S.ads.unshift({
                    id: uid(),
                    brand: adTemp.brand,
                    email: adTemp.email,
                    phone: adTemp.phone,
                    ct: adTemp.ct,
                    type: adTemp.type,
                    place: adTemp.place,
                    psize: adTemp.psize,
                    budget: adTemp.price,
                    price: adTemp.price,
                    dur: adTemp.dur,
                    durK: adTemp.durK,
                    expiresAt: adTemp.expiresAt,
                    media: adTemp.media,
                    payCur: adTemp.payCur,
                    method: $('#apM') ? $('#apM').value : 'Bank',
                    trx,
                    shot: adPayShot || null,
                    ts: Date.now(),
                    status: 'pending'
                });
                adTemp = null;
                adPayShot = null;
                adMediaData = null;
                save();
                closeModal();
                toast(t('ad_pending_to'), 'zap');
                renderView();
                break
            }
        case 'adPrev':
            adSlideGo(adSlideIdx - 1);
            break;
        case 'adNext':
            adSlideGo(adSlideIdx + 1);
            break;
        case 'adDot':
            adSlideGo(+el.dataset.i);
            break;
        case 'popClose':
            closePop();
            break;
        case 'adAdmin':
            adAdminPanel();
            break;
        case 'adAdminGo':
            {
                if ($('#adPin').value.trim() === ADMIN_PIN) {
                    pinOk = true;
                    adminMode = true;
                    toast(t('admin_ok'), 'lock');
                    adAdminList()
                } else
                    toast(t('err_code'), 'alert');
                break
            }
        case 'bankSave':
            {
                S.bank = {
                    acc: $('#bkAcc').value.trim(),
                    name: $('#bkName').value.trim(),
                    holder: $('#bkHolder').value.trim(),
                    bkash: $('#bkBkash').value.trim(),
                    nagad: $('#bkNagad').value.trim(),
                    rocket: $('#bkRocket').value.trim()
                };
                save();
                toast(t('bank_saved'), 'wallet');
                break
            }
        case 'adApprove':
            {
                const a = (S.ads || []).find(x => x.id === el.dataset.id);
                if (!a)
                    break;
                a.status = 'live';
                save();
                notifyAdvertiser(a, true);
                toast(t('n_pay_ok'), 'zap');
                adAdminList();
                renderView();
                break
            }
        case 'adReject':
            {
                const a = (S.ads || []).find(x => x.id === el.dataset.id);
                if (!a)
                    break;
                a.status = 'rejected';
                save();
                notifyAdvertiser(a, false);
                toast(t('ad_rej_msg'), 'alert');
                adAdminList();
                renderView();
                break
            }
        case 'wdOpen':
            openWithdraw();
            break;
        case 'wdShot':
            pickShot();
            break;
        case 'azAdd':
            openAddAdLink();
            break;
        case 'azSave':
            azSaveLink();
            break;
        case 'azClick':
            azClick(el.dataset.id, el.dataset.url);
            break;
        case 'azCopy':
            azCopyLink(el.dataset.url);
            break;
        case 'azHit':
            azHit(el.dataset.id);
            break;
        case 'azImgPick':
            pickAzImg();
            break;
        case 'azWd':
            openAzWd();
            break;
        case 'azDel':
            {
                const l = (S.adLinks || []).find(x => x.id === el.dataset.id);
                if (!l || l.by !== 'me')
                    break;
                confirmModal(t('az_del_l'), t('del_q'), t('yes'), () => {
                    S.adLinks = S.adLinks.filter(x => x.id !== l.id);
                    save();
                    toast(t('del_ok'), 'trash');
                    renderAdZone()
                }
                );
                break
            }
        case 'savePayout':
            {
                const bank = $('#pBank').value.trim()
                  , acc = $('#pAcc').value.trim()
                  , holder = $('#pHolder').value.trim();
                if (!holder || holder.toLowerCase() !== me().name.toLowerCase()) {
                    toast(t('p_holder') + ' ' + t('wd_name_err') + ' "' + me().name + '"', 'alert');
                    break
                }
                me().payout = {
                    bank,
                    acc,
                    holder
                };
                save();
                toast(t('p_saved'), 'wallet');
                break
            }
        case 'saveName':
            {
                const v = $('#setName').value.trim();
                if (!v) {
                    toast(t('err_name'), 'alert');
                    break
                }
                me().name = v;
                save();
                toast(t('saved'), 'check');
                renderHeader();
                renderProfile();
                break
            }
        case 'editName':
            {
                viewState.ptab = 'settings';
                renderProfile();
                setTimeout( () => {
                    const x = $('#setName');
                    if (x)
                        x.focus()
                }
                , 100);
                break
            }
        case 'avatar':
            pickAvatar();
            break;
        case 'color':
            {
                me().color = el.dataset.c;
                save();
                renderProfile();
                break
            }
        case 'anonDef':
            {
                me().defAnon = !me().defAnon;
                save();
                renderProfile();
                break
            }
        case 'resetProf':
            confirmModal(t('reset_prof'), t('del_q'), t('reset_prof'), () => {
                const u = me();
                u.color = '#0000AD';
                u.bio = '';
                u.defAnon = false;
                u.photo = null;
                save();
                toast(t('saved'), 'check');
                renderProfile()
            }
            );
            break;
        case 'delAcc':
            confirmModal(t('del_acc'), t('del_q'), t('del'), () => {
                S.posts = S.posts.filter(p => p.author !== 'me');
                S.user = null;
                S.acct = null;
                save();
                go('feed');
                toast(t('del_ok'), 'trash')
            }
            );
            break;
        case 'tfa':
            {
                me().twoFA = !me().twoFA;
                save();
                renderProfile();
                break
            }
        case 'resetpw':
            toast(t('reset_ok'), 'send');
            break;
        case 'revoke':

            {
                S.user = null;
                save();
                renderHeader();
                go('feed');
                toast(t('revoke') + ' ✓', 'lock');
                break
            }
        case 'darkToggle':
            S.dark = !S.dark;
            save();
            applyDark();
            renderHeader();
            break;
        case 'bellToggle':
            toggleNotifs();
            break;
        case 'markRead':
            (S.notifs || []).forEach(n => n.read = true);
            save();
            renderBellPanel();
            break;
        case 'bm':
            {
                const id = el.dataset.id;
                const i = S.bookmarks.indexOf(id);
                if (i < 0) {
                    S.bookmarks.push(id);
                    toast(t('bmd'), 'bookmark')
                } else
                    S.bookmarks.splice(i, 1);
                save();
                renderView();
                break
            }
        case 'htag':
            {
                activeTag = activeTag === el.dataset.tag ? null : el.dataset.tag;
                go('feed');
                break
            }
        case 'recVoice':
            recordVoice();
            break;
        case 'coverModal':
            openCoverModal();
            break;
        case 'coverUp':
            pickCover();
            break;
        case 'coverPreset':
            {
                const u = me();
                const c = el.dataset.css;
                u.cover = c === 'SOLID' ? null : {
                    type: 'css',
                    css: COVERS[+c]
                };
                save();
                closeModal();
                renderProfile();
                toast(t('saved'), 'check');
                break
            }
        case 'coverRm':
            {
                me().cover = null;
                save();
                closeModal();
                renderProfile();
                toast(t('saved'), 'check');
                break
            }
        case 'logoUp':
            pickLogo();
            break;
        case 'friendSearch':
            closeModal();
            fsModal();
            break;
        case 'openHelp':
            openHelp();
            break;
        case 'openAbout':
            openAbout();
            break;
        case 'abImg':
            pickAbImg();
            break;
        case 'abSave':
            {
                S.about = {
                    name: $('#abName').value.trim(),
                    text: $('#abText').value.trim(),
                    img: abImgData || S.about.img
                };
                abImgData = null;
                save();
                closeModal();
                toast(t('saved'), 'check');
                openAbout();
                break
            }
        case 'avoToggle':
            avoToggle();
            break;
        case 'avoClose':
            avoToggle(false);
            break;
        case 'avoChip':
            avoPush(avoAnswerIntent(el.dataset.k));
            break;
        case 'doc':
            openDoc(el.dataset.d);
            break;
        case 'closeModal':
            closeModal();
            break;
        }
    } catch (err) {
        console.error(err);
        toast('⚠️ ' + err.message, 'alert')
    }
}
);
document.addEventListener('input', e => {
    if (e.target.id === 'topSearch')
        tsRender(e.target.value)
}
);
$('#avoForm').addEventListener('submit', e => {
    e.preventDefault();
    avoSend()
}
);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal();
        avoToggle(false);
        toggleMenu(false);
        closePop();
        const np = $('#notifPanel');
        if (np)
            np.classList.remove('open');
        const tr = $('#tsRes');
        if (tr)
            tr.classList.remove('open')
    }
}
);

/* ================= live reads + ad ticker + expiry ================= */
setInterval( () => {
    let expired = false;
    (S.ads || []).forEach(a => {
        if (a.status === 'live' && AD_EXP(a)) {
            a.status = 'expired';
            expired = true
        }
    }
    );
    if (expired) {
        toast('⏳ ' + t('st_expired'), 'bell');
        renderStrips();
        if (popTimer && !liveAds().some(a => placeOf(a) === 'pop')) {
            clearInterval(popTimer);
            popTimer = null;
            closePop()
        }
    }
    const p = S.posts[Math.floor(Math.random() * S.posts.length)];
    if (p) {
        const keys = Object.keys(CTRY);
        p.reads.total += 1 + Math.floor(Math.random() * 3);
        const c = keys[Math.floor(Math.random() * keys.length)];
        p.reads.by[c] = (p.reads.by[c] || 0) + 1;
        save();
        const a = document.getElementById('rd-' + p.id)
          , b = document.getElementById('rd2-' + p.id);
        if (a)
            a.textContent = fmt(p.reads.total);
        if (b)
            b.textContent = fmt(p.reads.total)
    }
    if (liveAds().length) {
        S.adRev = (S.adRev || 0) + 0.002;
        save();
        document.querySelectorAll('.adTicker').forEach(tk => tk.textContent = t('ad_rev') + ' +$' + S.adRev.toFixed(4) + '/s')
    }
    stripIdx.header++;
    stripIdx.footer++;
    renderStrips();
    if (!popTimer && liveAds().some(a => placeOf(a) === 'pop') && !document.getElementById('adPop'))
        startPops();
}
, 9000);

/* ================= init ================= */
function initSplash() {
    const quick = ['en', 'bn', 'hi', 'es', 'fr', 'ar', 'zh', 'pt'];
    $('#spQuick').innerHTML = quick.map(c => `<button data-act="setLang" data-lang="${c}">${(LANGS.find(l => l[0] === c) || [c])[1]}</button>`).join('');
    const det = (navigator.language || 'en').slice(0, 2);
    $('#spDet').textContent = 'DETECTED: ' + (TAGLINES[det] ? det.toUpperCase() : 'EN') + ' · ' + (TAGLINES[det] || TAGLINES.en).toUpperCase();
    const tags = Object.entries(TAGLINES);
    let i = tags.findIndex( ([c]) => c === S.lang);
    if (i < 0)
        i = 0;
    const rot = () => {
        const [c,tag] = tags[i % tags.length];
        const el = $('#spTag');
        if (!el)
            return;
        el.textContent = tag;
        el.classList.remove('sw');
        void el.offsetWidth;
        el.classList.add('sw');
        $('#spLang').textContent = c.toUpperCase();
        i++
    }
    ;
    rot();
    setInterval(rot, 1600);
    const ws2 = $('#spWords');
    if (ws2) {
        ws2.innerHTML = '';
        const wl = ['Autophagy', 'সব কথা খুলে বলো', ...TOPIC_KEYS.map(k => tl(k)), 'Repost 🔁', '🌐 100+ Languages', '💰 Earn Zone'];
        wl.forEach( (w, i2) => {
            const s = document.createElement('span');
            s.textContent = w;
            const r = mulberry(hashStr(w));
            s.style.left = (5 + r() * 70) + '%';
            s.style.top = (8 + r() * 80) + '%';
            s.style.fontSize = (14 + r() * 26) + 'px';
            s.style.animationDelay = (r() * -14) + 's';
            s.style.animationDuration = (12 + r() * 10) + 's';
            ws2.appendChild(s)
        }
        )
    }
}
load();
applyDark();
initFirebase();
document.documentElement.lang = S.lang;
document.documentElement.dir = RTL.has(S.lang) ? 'rtl' : 'ltr';
applyI18n();
renderHeader();
initSplash();

/* ═══════════ AUTOPHAGY · NEW FEATURES v1.0 — PART 1 ═══════════ */
/* রিলস · পোল · লোকেশন · ক্লোজ ফ্রেন্ডস · মেনশন — জিরো-টাচ (মূল কোডে হাত দেওয়া হয়নি) */

/* ---- নতুন স্টেট ---- */
let AP = { pendingLoc:null, pendingLocCt:'', pendingCF:false, mem:null, g:null, react:null, rps:null };

/* ---- নতুন শব্দ (রানটাইমে মার্জ — ফাইলের মূল D অজাত) ---- */
Object.assign(D.en, {
  reels:'Reels', reels_sub:'Short vertical videos — tap to play with sound.',
  games:'Mini Games', games_sub:'Take a break — play, relax, come back.',
  poll:'Poll', poll_create:'Create a poll', poll_q:'Question', poll_opt:'Option',
  poll_ok:'Poll published 📊', votes:'votes', poll_voted:'you voted',
  loc:'Location', loc_sub:'Tag a place — it shows on your next post.', loc_ph:'City, place or landmark…',
  loc_ok:'Location will attach to your next post 📍',
  close_fr:'Close Friends', cf_on:'Close Friends ON — only they see the next post', cf_off:'Close Friends OFF',
  cf_note:'Only these writers can see your Close Friends posts.',
  privacy_t:'Privacy Settings', privacy_sub:'You decide who sees you.',
  pv_private:'Private account', pv_private_s:'Only approved followers can see your posts',
  pv_msgs:'Who can message me', pv_posts:'Who can see my posts', pv_all:'Everyone',
  privacy_ok:'Privacy settings saved.',
  mention_nf:'No writer found for this mention',
  call_voice:'Voice call', call_video:'Video call', calling:'Calling…', connected:'Connected',
  end_call:'End call', call_ended:'Call ended — duration', cam_err:'Camera/mic unavailable — placeholder shown',
  g_guess:'Guess the Number', g_guess_s:'I picked a number 1–100. Find it!', g_try:'Try',
  g_high:'Too high ↑', g_low:'Too low ↓', g_win:'🎉 Correct! Found in', g_tries:'tries', g_again:'Play again',
  g_mem:'Memory Match', g_mem_s:'Find all emoji pairs in fewest moves.', g_moves:'Moves',
  g_react:'Reaction Test', g_react_s:'Wait for GREEN, then tap fast!',
  g_react_start:'Tap to start', g_react_wait:'Wait for green…', g_react_go:'TAP NOW!',
  g_react_ms:'Your reaction', g_react_foul:'Too early! Tap to start again.',
  g_rps:'Rock · Paper · Scissors', g_rps_s:'Win the round!', g_draw:'Draw!', g_you_win:'You win! 🎉', g_cpu_win:'CPU wins 🤖',
  g_you:'You', g_cpu:'CPU'
});
Object.assign(D.bn, {
  reels:'রিলস', reels_sub:'ছোট ভার্টিকাল ভিডিও — চাপ দাও, শব্দসহ চলবে।',
  games:'মিনি গেমস', games_sub:'একটু বিশ্রাম — খেলো, হালকা হও, ফিরে এসো।',
  poll:'পোল', poll_create:'পোল বানাও', poll_q:'প্রশ্ন', poll_opt:'অপশন',
  poll_ok:'পোল প্রকাশিত হয়েছে 📊', votes:'ভোট', poll_voted:'তুমি ভোট দিয়েছো',
  loc:'লোকেশন', loc_sub:'একটা জায়গা ট্যাগ করো — পরের পোস্টে দেখাবে।', loc_ph:'শহর, জায়গা বা ল্যান্ডমার্ক…',
  loc_ok:'লোকেশন পরের পোস্টে যুক্ত হবে 📍',
  close_fr:'ক্লোজ ফ্রেন্ডস', cf_on:'ক্লোজ ফ্রেন্ডস চালু — শুধু তারাই পরের পোস্ট দেখবে', cf_off:'ক্লোজ ফ্রেন্ডস বন্ধ',
  cf_note:'শুধু এই লেখকরা তোমার ক্লোজ ফ্রেন্ডস পোস্ট দেখবে।',
  privacy_t:'প্রাইভেসি সেটিংস', privacy_sub:'তুমি ঠিক করো কে তোমাকে দেখবে।',
  pv_private:'প্রাইভেট অ্যাকাউন্ট', pv_private_s:'শুধু অনুমোদিত ফলোয়ার তোমার পোস্ট দেখবে',
  pv_msgs:'কে আমাকে মেসেজ দিতে পারবে', pv_posts:'কে আমার পোস্ট দেখতে পারবে', pv_all:'সবাই',
  privacy_ok:'প্রাইভেসি সেটিংস সংরক্ষিত।',
  mention_nf:'এই মেনশনের লেখক পাওয়া যায়নি',
  call_voice:'ভয়েস কল', call_video:'ভিডিও কল', calling:'কল যাচ্ছে…', connected:'সংযুক্ত',
  end_call:'কল শেষ করো', call_ended:'কল শেষ — সময়', cam_err:'ক্যামেরা/মাইক নেই — প্লেসহোল্ডার দেখানো হচ্ছে',
  g_guess:'সংখ্যা অনুমান', g_guess_s:'আমি ১–১০০-এর মধ্যে একটা সংখ্যা ভেবেছি। খুঁজে বের করো!', g_try:'চেষ্টা করো',
  g_high:'অনেক বেশি ↑', g_low:'অনেক কম ↓', g_win:'🎉 ঠিক! খুঁজে পেলে', g_tries:'চেষ্টায়', g_again:'আবার খেলো',
  g_mem:'মেমরি ম্যাচ', g_mem_s:'কম মুভে সব ইমোজি জোড়া মেলাও।', g_moves:'মুভ',
  g_react:'রিঅ্যাকশন টেস্ট', g_react_s:'সবুজের অপেক্ষা করো, তারপর দ্রুত চাপ!',
  g_react_start:'শুরু করতে চাপ দাও', g_react_wait:'সবুজের জন্য অপেক্ষা…', g_react_go:'এখনই চাপ দাও!',
  g_react_ms:'তোমার রিঅ্যাকশন', g_react_foul:'অনেক আগে! আবার শুরু করতে চাপ দাও।',
  g_rps:'পাথর · কাগজ · কাঁচি', g_rps_s:'রাউন্ড জেতার চেষ্টা করো!', g_draw:'ড্র!', g_you_win:'তুমি জিতেছ! 🎉', g_cpu_win:'সিপিউ জিতল 🤖',
  g_you:'তুমি', g_cpu:'সিপিউ'
});

/* ---- নতুন আইকন ---- */
Object.assign(I, {
  reels:'<rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M10 8.2l5.4 3.8-5.4 3.8z" fill="currentColor" stroke="none"/>',
  game:'<rect x="2" y="7.5" width="20" height="9.5" rx="4.75"/><path d="M7 10.5v3M5.5 12h3M15.4 11h.01M18.2 13.4h.01"/>',
  pollicon:'<path d="M5 20V11M11 20V4M17 20v-6M3 20h18"/>',
  pin:'<path d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.9.36 1.78.7 2.62a2 2 0 0 1-.45 2.11L8.1 9.71a16 16 0 0 0 6.19 6.19l1.27-1.27a2 2 0 0 1 2.11-.45c.84.34 1.72.57 2.62.7A2 2 0 0 1 22 16.92z"/>'
});

/* ---- স্থায়ী ডাটা ---- */
S.privacy = S.privacy || {private:false, msgs:'all', posts:'all'};
S.closeFriends = S.closeFriends || [];
S.reelsLiked = S.reelsLiked || [];

/* ---- ডেমো রিলস ---- */
const DEMO_REELS = [
 {id:'rel1', name:'Amara Okafor', ct:'NG', cap:'Lagos at golden hour — the city sings and I sing back. #hope', vid:'https://www.w3schools.com/html/mov_bbb.mp4', likes:1240, cmts:86},
 {id:'rel2', name:'Yuki Tanaka', ct:'JP', cap:'Rain on the old window — twenty years, still remembering.', vid:'https://www.w3schools.com/html/movie.mp4', likes:2310, cmts:154},
 {id:'rel3', name:'Mehrab Hossain', ct:'BD', cap:'ঢাকার বৃষ্টি — কেউ জিজ্ঞেস করে না কেন ভিজছি। #ব্যথা', vid:'https://www.w3schools.com/html/mov_bbb.mp4', likes:1875, cmts:203}
];

/* ═══ রিলস ═══ */
function reelsData(){
  const own=(S.posts||[]).filter(p=>(p.media||[]).some(m=>m.type==='video')).map(p=>{
    let who=t('anon'), ct='';
    if(p.author==='me'&&me()){ who=me().name; ct=me().ct; }
    else if(person(p.author)){ who=person(p.author).name; ct=person(p.author).ct||''; }
    return {id:p.id, isPost:true, name:who, ct, cap:p.text||'', vid:p.media.find(m=>m.type==='video').url,
      likes:(Array.isArray(p.likes)?p.likes.length:p.likes)||0, cmts:(p.comments||[]).length};
  });
  return own.concat(DEMO_REELS);
}
function renderReels(){
  view='reels';
  $('#view').innerHTML=`<button class="backb" data-act="backFeed">${ic('back','width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="surge-h" style="margin-top:4px"><h2>🎬 ${esc(t('reels'))}</h2><p>${esc(t('reels_sub'))}</p></div>
  <div class="reels-wrap" style="padding-top:16px">${reelsData().map(reelCard).join('')}</div>`;
  renderHeader(); toggleMenu(false);
  window.scrollTo({top:0,behavior:'smooth'});
}
function reelCard(r){
  const liked=S.reelsLiked.includes(r.id);
  const cnt=(r.likes||0)+(liked?1:0);
  return `<div class="reel" id="reel-${esc(r.id)}">
   <video src="${esc(r.vid)}" loop playsinline preload="metadata" muted data-act="reelPlay" data-id="${esc(r.id)}"></video>
   <div class="reel-top"><span class="stamp">🎬 ${esc(t('reels'))}</span>${r.isPost?`<span class="stamp" data-act="apOpenP" data-id="${esc(r.id)}" style="cursor:pointer">📝 ${esc(t('open'))}</span>`:''}</div>
   <div class="reel-acts">
     <button class="reel-b ${liked?'on':''}" data-act="reelLike" data-id="${esc(r.id)}">${ic('heart')}<span>${fmt(cnt)}</span></button>
     <button class="reel-b" data-act="reelCmt" data-id="${esc(r.id)}">💬<span>${fmt(r.cmts||0)}</span></button>
     <button class="reel-b" data-act="reelShare" data-id="${esc(r.id)}">${ic('share')}<span>${esc(t('share'))}</span></button>
   </div>
   <div class="reel-cap"><b>${esc(r.name)}</b>${r.ct?' · '+esc(r.ct):''}<p>${esc(r.cap)}</p></div>
  </div>`;
}
function reelPlay(id){
  const v=document.querySelector('#reel-'+CSS.escape(id)+' video'); if(!v) return;
  if(v.paused){ v.play().catch(()=>{}); } else v.pause();
}
function reelLike(id){
  const i=S.reelsLiked.indexOf(id);
  if(i<0){ S.reelsLiked.push(id); toast(t('like')+' ❤️','heart'); } else S.reelsLiked.splice(i,1);
  save();
  const b=document.querySelector('#reel-'+CSS.escape(id)+' [data-act="reelLike"]');
  const r=reelsData().find(x=>x.id===id);
  if(b&&r){ b.classList.toggle('on',S.reelsLiked.includes(id)); const sp=b.querySelector('span'); if(sp) sp.textContent=fmt((r.likes||0)+(S.reelsLiked.includes(id)?1:0)); }
}
function reelShare(id){
  const url=location.href.split('#')[0]+'#reel-'+id;
  if(navigator.clipboard) navigator.clipboard.writeText(url).catch(()=>{});
  toast(t('share_ok'),'share');
}
function reelCmt(id){
  const p=S.posts.find(x=>x.id===id);
  if(p){ go('feed'); setTimeout(()=>{ const n=document.getElementById('post-'+id); if(n){ n.scrollIntoView({behavior:'smooth',block:'center'}); openC.add(id); renderFeed(); } },250); }
  else toast('💬 '+t('comment')+' — '+t('reels'),'cmt');
}

/* ═══ পোল ═══ */
function openPollComposer(){
  if(!me()) return openAuth('login');
  modal(`<h3>📊 ${esc(t('poll_create'))}</h3>
   <div class="field"><label>${esc(t('poll_q'))}</label><input id="polQ" maxlength="150"></div>
   <div id="pollOpts">
     <div class="field"><input class="po-in" placeholder="${esc(t('poll_opt'))} 1" maxlength="60"></div>
     <div class="field"><input class="po-in" placeholder="${esc(t('poll_opt'))} 2" maxlength="60"></div>
   </div>
   <button class="btn ghost sm" data-act="pollAddOpt">+ ${esc(t('poll_opt'))}</button>
   <div class="field" style="margin-top:14px"><label>${esc(t('pick_feeling'))}</label><select id="polEmo">${TOPIC_KEYS.map(k=>`<option value="${k}">${esc(tl(k))}</option>`).join('')}</select></div>
   <button class="btn" style="width:100%;justify-content:center" data-act="pollGo">${ic('send')}${esc(t('publish'))}</button>`);
}
function pollAddOpt(){
  const box=$('#pollOpts'); if(!box||box.children.length>=6) return;
  const d=document.createElement('div'); d.className='field';
  d.innerHTML=`<input class="po-in" placeholder="${esc(t('poll_opt'))} ${box.children.length+1}" maxlength="60">`;
  box.appendChild(d);
}
function publishPoll(){
  const u=me(); if(!u) return openAuth('login');
  const q=($('#polQ').value||'').trim();
  const opts=$$('#pollOpts .po-in').map(i=>i.value.trim()).filter(Boolean);
  if(!q||opts.length<2){ toast(t('err_name'),'alert'); return; }
  S.posts.unshift({ id:uid(), author:'me', anon:!!u.defAnon, emotion:$('#polEmo').value||'story', text:q,
    poll:{opts:opts.map(x=>({txt:x,n:0})), voters:{}}, ts:Date.now(),
    likes:[], shares:0, comments:[], reads:{total:14,by:{US:4,BD:4},byAge:{'18-24':7,'25-34':7}} });
  save(); closeModal(); toast(t('poll_ok'),'check'); renderView();
}
function pollVote(id,i){
  const u=me(); if(!u) return openAuth('login');
  const p=S.posts.find(x=>x.id===id); if(!p||!p.poll) return;
  p.poll.voters=p.poll.voters||{};
  if(p.poll.voters[u.id]!=null) return;
  p.poll.voters[u.id]=i; p.poll.opts[i].n=(p.poll.opts[i].n||0)+1;
  save(); toast(t('poll_voted')+' ✓','check'); renderView();
}
function pollHTML(p){
  if(!p.poll) return '';
  const u=me(); const my=u?(p.poll.voters||{})[u.id]:null; const done=my!=null;
  const total=p.poll.opts.reduce((s,o)=>s+(o.n||0),0);
  return `<div class="pollbox"><div class="poll-q">📊 ${esc(p.poll.q||p.text||'')}</div>
   ${p.poll.opts.map((o,i)=>{
     const pct=total?Math.round((o.n||0)/total*100):0;
     return `<button class="poll-opt ${done?'done':''} ${my===i?'chosen':''}" data-act="pollVote" data-id="${esc(p.id)}" data-i="${i}">
      <span class="po-bar" style="width:${done?pct:0}%"></span>
      <span class="po-txt"><span>${esc(o.txt)}</span>${done?`<b class="mono">${pct}%</b>`:''}</span></button>`;
   }).join('')}
   <div class="poll-meta mono">🗳 ${fmt(total)} ${esc(t('votes'))}${done?' · '+esc(t('poll_voted')):''}</div></div>`;
}

/* ═══ লোকেশন ═══ */
function openLocPick(){
  if(!me()) return openAuth('login');
  modal(`<h3>🗺️ ${esc(t('loc'))}</h3><p class="sub">${esc(t('loc_sub'))}</p>
   <div class="field"><label>${esc(t('loc'))}</label><input id="locIn" value="${esc(AP.pendingLoc||'')}" placeholder="${esc(t('loc_ph'))}"></div>
   <div class="field"><label>${esc(t('ph_country'))}</label><select id="locCt"><option value="">—</option>${Object.entries(CTRY).map(([c,n])=>`<option ${AP.pendingLocCt===c?'selected':''} value="${c}">${esc(n)}</option>`).join('')}</select></div>
   <button class="btn" style="width:100%;justify-content:center" data-act="locSave">${ic('pin')}${esc(t('save'))}</button>`);
}
function locSave(){
  const v=($('#locIn').value||'').trim();
  AP.pendingLoc=v||null; AP.pendingLocCt=$('#locCt')?$('#locCt').value:'';
  closeModal(); if(v) toast(t('loc_ok'),'pin');
  injectComposerTools();
}
/* পরের নিজের পোস্টে লোকেশন+ক্লোজফ্রেন্ডস অটো-অ্যাটাচ (মূল publish অক্ষত) */
setInterval(()=>{
  try{
    const p0=S.posts[0];
    if(p0&&p0.author==='me'&&Date.now()-p0.ts<30000){
      let dirty=false;
      if(AP.pendingLoc&&!p0.loc){ p0.loc=AP.pendingLoc; if(AP.pendingLocCt)p0.locCt=AP.pendingLocCt; AP.pendingLoc=null; dirty=true; }
      if(AP.pendingCF&&!p0.cf){ p0.cf=true; AP.pendingCF=false; dirty=true; }
      if(dirty){ save(); injectComposerTools(); renderView(); }
    }
  }catch(e){}
},1000);

/* ═══ ক্লোজ ফ্রেন্ডস ═══ */
function cfToggle(){
  if(!me()) return openAuth('login');
  AP.pendingCF=!AP.pendingCF;
  toast(AP.pendingCF?t('cf_on'):t('cf_off'),'users');
  try{ refreshComposer(); }catch(e){}
  injectComposerTools();
}

/* ═══ মেনশন (@username) স্ক্যানার — টেক্সট-নোড নিরাপদ রিপ্লেস ═══ */
function scanMentions(el){
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null);
  const nodes=[]; let n; while((n=w.nextNode())) nodes.push(n);
  nodes.forEach(node=>{
    const txt=node.textContent||'';
    if(!/@[A-Za-z0-9_]{2,20}/.test(txt)||txt.indexOf('@')<0) return;
    const sp=document.createElement('span');
    sp.innerHTML=esc(txt).replace(/@([A-Za-z0-9_]{2,20})/g,'<span class="mention" data-act="mentionGo" data-u="$1">@$1</span>');
    node.parentNode.replaceChild(sp,node);
  });
}
function mentionGo(u){
  const q=(u||'').toLowerCase();
  const pp=PEOPLE.find(p=>p.name.toLowerCase().split(/\s+/)[0]===q||p.name.toLowerCase().replace(/\s+/g,'_')===q||(p.id||'').toLowerCase().endsWith(q));
  if(pp){ renderPersonProfile(pp.id); window.scrollTo({top:0,behavior:'smooth'}); }
  else toast(t('mention_nf')+' — @'+u,'alert');
}
/* ═══════════ END PART 1 ═══════════ */
/* ═══════════ AUTOPHAGY · NEW FEATURES v1.0 — PART 2 (FINAL) ═══════════ */
/* গেমস · কল · প্রাইভেসি · অটো-ইনজেক্টর · ক্লিক-হ্যান্ডলার — মূল কোডে হাত দেওয়া হয়নি */

function apModalSet(html){ const c=$('#mcard'); if(c) c.innerHTML=html; }
function apMarkRail(act){ try{ $$('#rail .rl').forEach(b=>b.classList.remove('on')); const b=document.querySelector('#rail [data-act="'+act+'"]'); if(b) b.classList.add('on'); }catch(e){} }

/* ═══ রেইল ইনজেকশন (ডেস্কটপ সাইডবারে রিলস/গেমস/প্রাইভেসি) ═══ */
function injectRail(){
  const rail=$('#rail'); if(!rail) return;
  let box=document.getElementById('railAp'); if(box) box.remove();
  box=document.createElement('div'); box.id='railAp';
  box.style.cssText='display:flex;flex-direction:column;gap:2px';
  box.innerHTML=`<div class="msep" style="margin:7px 6px"></div>
   <button class="rl ${view==='reels'?'on':''}" data-act="openReels">${ic('reels')}<span>${esc(t('reels'))}</span></button>
   <button class="rl ${view==='games'?'on':''}" data-act="openGames">${ic('game')}<span>${esc(t('games'))}</span></button>
   <button class="rl ${view==='privacy'?'on':''}" data-act="openPrivacy">${ic('lock')}<span>${esc(t('privacy_t'))}</span></button>`;
  const sp=rail.querySelector('.rl-sp');
  if(sp) rail.insertBefore(box,sp); else rail.appendChild(box);
}

/* ═══ কম্পোজার টুলস (📍 লোকেশন · 👥 ক্লোজ ফ্রেন্ডস · 📊 পোল) ═══ */
function apToolBtns(){
  if(!me()) return '';
  return `<button class="tool${AP.pendingLoc?' on':''}" data-act="locPick">${ic('pin')}${esc(t('loc'))}${AP.pendingLoc?' ✓':''}</button>
  <button class="tool${AP.pendingCF?' on':''}" data-act="cfToggle">${ic('users')}${esc(t('close_fr'))}${AP.pendingCF?' ✓':''}</button>
  <button class="tool" data-act="openPoll">📊 ${esc(t('poll_create'))}</button>`;
}
function injectComposerTools(){
  try{
    const tools=document.querySelector('#composer .tools'); if(!tools) return;
    let box=document.getElementById('apTools');
    if(!box){
      box=document.createElement('span'); box.id='apTools';
      box.style.cssText='display:flex;gap:4px;flex-wrap:wrap';
      const vid=tools.querySelector('[data-m="vid"]');
      if(vid) vid.after(box); else tools.appendChild(box);
    }
    box.innerHTML=apToolBtns();
  }catch(e){}
}

/* ═══ জিরো-টাচ র‍্যাপার — মূল ফাংশনগুলো অক্ষত, শুধু পরে জিনিস যোগ হয় ═══ */
const __apRF=renderFeed;
renderFeed=function(){ __apRF();
  try{
    const ad=document.querySelector('#view .adslot');
    if(ad&&!document.getElementById('apRow')){
      ad.insertAdjacentHTML('afterend',`<div class="trendrow" id="apRow" style="margin-top:14px">
       <span class="panelab">✨ NEW</span>
       <button class="stamp" data-act="openReels">🎬 ${esc(t('reels'))}</button>
       <button class="stamp" data-act="openGames">🎮 ${esc(t('games'))}</button>
       <button class="stamp" data-act="openPoll">📊 ${esc(t('poll_create'))}</button>
       <button class="stamp" data-act="openPrivacy">🔐 ${esc(t('privacy_t'))}</button></div>`);
    }
    injectComposerTools();
  }catch(e){}
};
const __apRV=renderView;
renderView=function(){ __apRV(); try{ const v=$('#view'); if(v) scanMentions(v); }catch(e){} };
const __apModal=modal;
modal=function(html){ __apModal(html); try{ const c=$('#mcard'); if(c) scanMentions(c); }catch(e){} };
const __apRC=refreshComposer;
refreshComposer=function(){ __apRC(); injectComposerTools(); };
const __apRM=renderMsgs;
renderMsgs=function(){ __apRM(); try{ injectCallBtns(); }catch(e){} };
const __apSL=setLang;
setLang=function(l){ __apSL(l); try{ injectRail(); }catch(e){} };
const __apCM=closeModal;
closeModal=function(){ try{ if(apCall){ if(apCall.timer)clearInterval(apCall.timer); if(apCall.stream)apCall.stream.getTracks().forEach(x=>x.stop()); apCall=null; } }catch(e){} __apCM(); };

/* pollHTML v2 — প্রশ্ন দুইবার না দেখায় (body-তেই থাকে) */
function pollHTML(p){
  if(!p.poll) return '';
  const u=me(); const my=u?(p.poll.voters||{})[u.id]:null; const done=my!=null;
  const total=p.poll.opts.reduce((s,o)=>s+(o.n||0),0);
  const q=(p.poll.q&&p.poll.q!==p.text)?`<div class="poll-q">📊 ${esc(p.poll.q)}</div>`:'';
  return `<div class="pollbox">${q}
   ${p.poll.opts.map((o,i)=>{
     const pct=total?Math.round((o.n||0)/total*100):0;
     return `<button class="poll-opt ${done?'done':''} ${my===i?'chosen':''}" data-act="pollVote" data-id="${esc(p.id)}" data-i="${i}">
      <span class="po-bar" style="width:${done?pct:0}%"></span>
      <span class="po-txt"><span>${esc(o.txt)}</span>${done?`<b class="mono">${pct}%</b>`:''}</span></button>`;
   }).join('')}
   <div class="poll-meta mono">🗳 ${fmt(total)} ${esc(t('votes'))}${done?' · '+esc(t('poll_voted')):''}</div></div>`;
}

/* ═══ পোস্টকার্ড র‍্যাপার — পোল + 📍লোকেশন + 👥CF ব্যাজ অটো-যুক্ত ═══ */
const __apPC=postCard;
postCard=function(p){
  let h=__apPC(p);
  try{
    if(p.loc) h=h.replace('<span class="p-reads">',`<span class="p-loc">${ic('pin','width:12px;height:12px')}${esc(p.loc)}${p.locCt?' · '+esc(p.locCt):''}</span><span class="p-reads">`);
    if(p.cf) h=h.replace('<span class="p-reads">',`<span class="stamp cf-stamp">👥 ${esc(t('close_fr'))}</span><span class="p-reads">`);
    if(p.poll) h=h.replace('<div class="p-acts">',pollHTML(p)+'<div class="p-acts">');
  }catch(e){}
  return h;
};

/* ═══ চ্যাটে কল বাটন ═══ */
function injectCallBtns(){
  const top=document.querySelector('.mtop'); if(!top) return;
  if(top.querySelector('[data-act="callV"]')) return;
  const b=document.createElement('span');
  b.style.cssText='margin-inline-start:auto;display:flex;gap:6px';
  b.innerHTML=`<button class="pact" data-act="callA" title="${esc(t('call_voice'))}">${ic('phone','width:15px;height:15px')}</button>
  <button class="pact" data-act="callV" title="${esc(t('call_video'))}">${ic('vid','width:15px;height:15px')}</button>`;
  top.appendChild(b);
}

/* ═══ কল সিস্টেম (ডেমো + আসল ক্যামেরা প্রিভিউ) ═══ */
let apCall=null;
function openCall(kind){
  if(!me()) return openAuth('login');
  const p=person(curThread); const name=p?p.name:(curThread||'?');
  apCall={kind,who:name,start:0,timer:null,stream:null};
  const av=p?HUES[PEOPLE.indexOf(p)%HUES.length]:'#0000AD';
  modal(`<h3 class="call-t">${kind==='v'?'📹':'📞'} ${esc(t(kind==='v'?'call_video':'call_voice'))}</h3>
   <div class="av call-av" style="background:${av}">${esc((name[0]||'?').toUpperCase())}</div>
   <div class="call-t">${esc(name)}</div>
   <div class="call-s" id="callSt">${esc(t('calling'))}</div>
   <video id="callLocal" class="call-video" autoplay muted playsinline style="display:${kind==='v'?'block':'none'}"></video>
   <button class="btn call-end" data-act="callEnd">${ic('x')}${esc(t('end_call'))}</button>`);
  setTimeout(async()=>{
    if(!apCall) return;
    const st=$('#callSt'); if(st) st.textContent='✅ '+t('connected');
    apCall.start=Date.now();
    apCall.timer=setInterval(()=>{ if(!apCall)return;
      const s=Math.floor((Date.now()-apCall.start)/1000);
      const el=$('#callSt'); if(el) el.textContent='⏱ '+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    },1000);
    if(kind==='v'&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
      try{
        const s=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
        apCall.stream=s; const v=$('#callLocal'); if(v) v.srcObject=s;
      }catch(e){
        const v=$('#callLocal');
        if(v){ const n=document.createElement('p'); n.className='call-s'; n.textContent='⚠️ '+t('cam_err'); v.replaceWith(n); }
      }
    }
  },1800);
}
function endCall(){
  if(!apCall) return closeModal();
  const dur=apCall.start?Math.floor((Date.now()-apCall.start)/1000):0;
  if(apCall.timer) clearInterval(apCall.timer);
  if(apCall.stream) apCall.stream.getTracks().forEach(x=>x.stop());
  toast(t('call_ended')+' '+Math.floor(dur/60)+':'+String(dur%60).padStart(2,'0'),'phone');
  apCall=null; closeModal();
}

/* ═══ মিনি গেমস ═══ */
function renderGames(){
  view='games';
  $('#view').innerHTML=`<button class="backb" data-act="backFeed">${ic('back','width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="surge-h" style="margin-top:4px"><h2>🎮 ${esc(t('games'))}</h2><p>${esc(t('games_sub'))}</p></div>
  <div class="games-grid">
   <button class="game-card" data-act="gameOpen" data-g="guess"><span class="g-ic">🎯</span><b>${esc(t('g_guess'))}</b><span>${esc(t('g_guess_s'))}</span></button>
   <button class="game-card" data-act="gameOpen" data-g="mem"><span class="g-ic">🧠</span><b>${esc(t('g_mem'))}</b><span>${esc(t('g_mem_s'))}</span></button>
   <button class="game-card" data-act="gameOpen" data-g="react"><span class="g-ic">⚡</span><b>${esc(t('g_react'))}</b><span>${esc(t('g_react_s'))}</span></button>
   <button class="game-card" data-act="gameOpen" data-g="rps"><span class="g-ic">✊</span><b>${esc(t('g_rps'))}</b><span>${esc(t('g_rps_s'))}</span></button>
  </div>`;
  renderHeader(); apMarkRail('openGames'); toggleMenu(false);
  window.scrollTo({top:0,behavior:'smooth'});
}
/* গেম ১: সংখ্যা অনুমান */
function gGuessStart(){
  AP.g={n:1+Math.floor(Math.random()*100),tries:0};
  modal(`<h3>🎯 ${esc(t('g_guess'))}</h3><p class="sub">${esc(t('g_guess_s'))}</p>
   <div id="gGLog" style="min-height:24px;font-weight:600;color:var(--blue);margin-bottom:8px"></div>
   <div class="cmt-form"><input id="gGIn" type="number" min="1" max="100" placeholder="1–100"><button class="c-send" data-act="gGuessGo">${ic('send','width:15px;height:15px')}</button></div>
   <div class="mono" style="margin-top:10px;font-size:12px;color:var(--mut)"><span id="gGT">0</span> ${esc(t('g_tries'))} · <button class="pact" data-act="gGuessNew">🔄 ${esc(t('g_again'))}</button></div>`);
  const gi=$('#gGIn'); if(gi) gi.onkeydown=e=>{ if(e.key==='Enter') gGuessGo(); };
}
function gGuessGo(){
  if(!AP.g) AP.g={n:1+Math.floor(Math.random()*100),tries:0};
  const v=parseInt($('#gGIn').value,10); if(!(v>=1&&v<=100)) return;
  AP.g.tries++; const log=$('#gGLog'), tEl=$('#gGT'); $('#gGIn').value='';
  if(!tEl) return;
  tEl.textContent=AP.g.tries;
  if(v===AP.g.n){ log.textContent=t('g_win')+' '+AP.g.tries+' '+t('g_tries'); log.style.color='#0B6E4F'; }
  else { log.textContent=v>AP.g.n?t('g_high'):t('g_low'); log.style.color='#B4530A'; }
}
/* গেম ২: মেমরি ম্যাচ */
function gMemStart(){
  const em=['🌸','🔥','🌙','⭐','🌊','🎸','📖','💫'];
  AP.mem={deck:em.concat(em).map(e=>({e,done:false})).sort(()=>Math.random()-.5),open:[],moves:0,lock:false};
  modal(`<h3>🧠 ${esc(t('g_mem'))}</h3><p class="sub">${esc(t('g_mem_s'))}</p>
   <div class="mono" style="font-size:12px;color:var(--mut);margin-bottom:4px">${esc(t('g_moves'))}: <b id="gMv">0</b></div>
   <div id="gMemBox"></div>
   <button class="btn ghost sm" style="margin-top:12px" data-act="gMemNew">🔄 ${esc(t('g_again'))}</button>`);
  gMemDraw();
}
function gMemDraw(){
  const box=$('#gMemBox'); if(!box||!AP.mem) return;
  box.innerHTML='<div class="mem-grid">'+AP.mem.deck.map((c,i)=>`<button class="mem-c ${c.done?'done':''}" data-act="gMemFlip" data-i="${i}">${(c.done||AP.mem.open.includes(i))?c.e:''}</button>`).join('')+'</div>';
  const mv=$('#gMv'); if(mv) mv.textContent=AP.mem.moves;
  if(AP.mem.deck.every(c=>c.done)) box.insertAdjacentHTML('beforeend',`<p style="text-align:center;margin-top:12px;font-weight:700;color:#0B6E4F">🎉 ${esc(t('g_win'))} ${AP.mem.moves} ${esc(t('g_moves'))}</p>`);
}
function gMemFlip(i){
  const M=AP.mem; if(!M||M.lock||M.open.includes(i)||M.deck[i].done) return;
  M.open.push(i); gMemDraw();
  if(M.open.length===2){
    M.moves++; M.lock=true; const [a,b]=M.open;
    setTimeout(()=>{
      if(M.deck[a].e===M.deck[b].e){ M.deck[a].done=M.deck[b].done=true; }
      M.open=[]; M.lock=false; gMemDraw();
    },M.deck[a].e===M.deck[b].e?350:650);
  }
}
/* গেম ৩: রিঅ্যাকশন টেস্ট */
function gReactStart(){
  AP.react={st:'idle',t0:0,timer:null};
  modal(`<h3>⚡ ${esc(t('g_react'))}</h3><p class="sub">${esc(t('g_react_s'))}</p>
   <button id="gRBtn" data-act="gReactTap" style="width:100%;min-height:170px;border-radius:14px;border:2px solid var(--line);background:var(--wash);font-family:var(--serif);font-size:20px;font-weight:600;color:var(--ink)">${esc(t('g_react_start'))}</button>
   <div id="gRRes" class="mono" style="text-align:center;margin-top:10px;font-size:13px;color:var(--mut)"></div>`);
}
function gReactTap(){
  const B=$('#gRBtn'); if(!B) return;
  const R=AP.react||(AP.react={st:'idle',t0:0,timer:null});
  if(R.st==='idle'||R.st==='foul'||R.st==='done'){
    B.style.background='#C0195B'; B.style.borderColor='#C0195B'; B.style.color='#fff';
    B.textContent=t('g_react_wait'); $('#gRRes').textContent=''; R.st='wait';
    R.timer=setTimeout(()=>{ if(!AP.react||AP.react.st!=='wait')return; R.st='go'; R.t0=Date.now(); B.style.background='#0B6E4F'; B.style.borderColor='#0B6E4F'; B.textContent=t('g_react_go'); },1200+Math.random()*2600);
  } else if(R.st==='wait'){
    clearTimeout(R.timer); R.st='foul';
    B.style.background='var(--wash)'; B.style.borderColor='var(--line)'; B.style.color='var(--ink)'; B.textContent=t('g_react_start');
    $('#gRRes').textContent='⚠️ '+t('g_react_foul');
  } else if(R.st==='go'){
    const ms=Date.now()-R.t0; R.st='done';
    B.style.background='var(--wash)'; B.style.borderColor='var(--line)'; B.style.color='var(--ink)'; B.textContent=t('g_react_start');
    $('#gRRes').innerHTML=`✅ ${esc(t('g_react_ms'))}: <b style="color:var(--blue);font-size:17px">${ms} ms</b>`;
  }
}
/* গেম ৪: পাথর-কাগজ-কাঁচি */
function gRpsStart(){
  AP.rps={you:0,cpu:0};
  modal(`<h3>✊ ${esc(t('g_rps'))}</h3><p class="sub">${esc(t('g_rps_s'))}</p>
   <div id="gRpsBoard" style="text-align:center;font-size:38px;min-height:64px">✊ ✊</div>
   <div id="gRpsMsg" style="text-align:center;font-weight:700;margin:6px 0 12px;color:var(--blue)"></div>
   <div style="display:flex;gap:10px;justify-content:center">
    <button class="btn ghost rps-b" data-act="gRpsGo" data-c="0">✊</button>
    <button class="btn ghost rps-b" data-act="gRpsGo" data-c="1">✋</button>
    <button class="btn ghost rps-b" data-act="gRpsGo" data-c="2">✌️</button>
   </div>
   <div class="mono" style="text-align:center;margin-top:12px;font-size:13px;color:var(--mut)">${esc(t('g_you'))} <b id="gRY">0</b> — <b id="gRC">0</b> ${esc(t('g_cpu'))}</div>`);
}
function gRpsGo(c){
  const R=AP.rps||(AP.rps={you:0,cpu:0});
  const cpu=Math.floor(Math.random()*3), E=['✊','✋','✌️'];
  const res=(c===cpu)?'d':(((c-cpu+3)%3===1)?'w':'l');
  if(res==='w') R.you++; else if(res==='l') R.cpu++;
  const b=$('#gRpsBoard'); if(b) b.textContent=E[c]+' '+E[cpu];
  const m=$('#gRpsMsg');
  if(m){ m.textContent=res==='d'?t('g_draw'):res==='w'?t('g_you_win'):t('g_cpu_win'); m.style.color=res==='d'?'var(--mut)':res==='w'?'#0B6E4F':'#C0195B'; }
  const y=$('#gRY'),cc=$('#gRC'); if(y) y.textContent=R.you; if(cc) cc.textContent=R.cpu;
}

/* ═══ প্রাইভেসি সেটিংস ═══ */
function renderPrivacy(){
  view='privacy';
  const P=S.privacy;
  const follows=(S.follows||[]).map(person).filter(Boolean);
  const sel=(id,val)=>`<select id="${id}" style="border:1px solid var(--line);border-radius:10px;padding:9px 12px;background:#fff;color:var(--ink)">
    <option value="all" ${val==='all'?'selected':''}>🌍 ${esc(t('pv_all'))}</option>
    <option value="fl" ${val==='fl'?'selected':''}>👥 ${esc(t('followers_n'))}</option>
    <option value="none" ${val==='none'?'selected':''}>🚫 ✕</option></select>`;
  $('#view').innerHTML=`<button class="backb" data-act="backFeed">${ic('back','width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="surge-h" style="margin-top:4px"><h2>🔐 ${esc(t('privacy_t'))}</h2><p>${esc(t('privacy_sub'))}</p></div>
  <div class="slist" style="max-width:680px">
   <div class="setrow"><span class="sl"><b>🔒 ${esc(t('pv_private'))}</b><span>${esc(t('pv_private_s'))}</span></span>
     <button class="sw2 ${P.private?'on':''}" data-act="pvPriv" role="switch" aria-checked="${!!P.private}"></button></div>
   <div class="setrow"><span class="sl"><b>💬 ${esc(t('pv_msgs'))}</b></span>${sel('pvMsgs',P.msgs)}</div>
   <div class="setrow"><span class="sl"><b>📖 ${esc(t('pv_posts'))}</b></span>${sel('pvPosts',P.posts)}</div>
   <button class="btn" style="margin-top:16px" data-act="pvSave">✅ ${esc(t('save'))}</button>
   <h5 class="panelab" style="margin:26px 0 6px">👥 ${esc(t('close_fr'))}</h5>
   <p style="font-size:13px;color:var(--mut);margin-bottom:8px">${esc(t('cf_note'))}</p>
   ${follows.length?follows.map(p=>{
     const on=S.closeFriends.includes(p.id);
     return `<div class="rowline"><div class="tt"><div class="sn">${esc(p.name)}</div><div class="mt">${esc(p.ct||'')}</div></div>
     <button class="btn ghost sm" style="${on?'background:var(--blue);color:#fff;border-color:var(--blue)':''}" data-act="cfAdd" data-u="${esc(p.id)}">${on?'✓ ':'+ '}${esc(t('close_fr'))}</button></div>`;
   }).join(''):`<p style="color:var(--mut)">${esc(t('no_res'))}</p>`}
  </div>`;
  renderHeader(); apMarkRail('openPrivacy'); toggleMenu(false);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ═══ নতুন ক্লিক-হ্যান্ডলার (তোমার হ্যান্ডলারের পাশে চলে — কোনো কনফ্লিক্ট নেই) ═══ */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'openReels': renderReels(); apMarkRail('openReels'); break;
    case 'openGames': renderGames(); break;
    case 'openPrivacy': if(!me()) return openAuth('login'); renderPrivacy(); break;
    case 'reelPlay': reelPlay(el.dataset.id); break;
    case 'reelLike': reelLike(el.dataset.id); break;
    case 'reelShare': reelShare(el.dataset.id); break;
    case 'reelCmt': case 'apOpenP': reelCmt(el.dataset.id); break;
    case 'openPoll': closeModal(); openPollComposer(); break;
    case 'pollAddOpt': pollAddOpt(); break;
    case 'pollGo': publishPoll(); break;
    case 'pollVote': pollVote(el.dataset.id,+el.dataset.i); break;
    case 'locPick': openLocPick(); break;
    case 'locSave': locSave(); break;
    case 'cfToggle': cfToggle(); break;
    case 'mentionGo': mentionGo(el.dataset.u); break;
    case 'callA': openCall('a'); break;
    case 'callV': openCall('v'); break;
    case 'callEnd': endCall(); break;
    case 'gameOpen': closeModal();
      { const g=el.dataset.g;
        if(g==='guess') gGuessStart();
        else if(g==='mem') gMemStart();
        else if(g==='react') gReactStart();
        else gRpsStart(); }
      break;
    case 'gGuessGo': gGuessGo(); break;
    case 'gGuessNew': gGuessStart(); break;
    case 'gMemFlip': gMemFlip(+el.dataset.i); break;
    case 'gMemNew': gMemStart(); break;
    case 'gReactTap': gReactTap(); break;
    case 'gRpsGo': gRpsGo(+el.dataset.c); break;
    case 'pvPriv': S.privacy.private=!S.privacy.private; save(); renderPrivacy(); break;
    case 'pvSave':
      { const m=$('#pvMsgs'),p2=$('#pvPosts');
        S.privacy.msgs=m?m.value:'all'; S.privacy.posts=p2?p2.value:'all';
        save(); toast(t('privacy_ok'),'lock'); }
      break;
    case 'cfAdd':
      { const id=el.dataset.u; const i=S.closeFriends.indexOf(id);
        if(i<0){ S.closeFriends.push(id); toast('👥 ✓','users'); } else S.closeFriends.splice(i,1);
        save(); renderPrivacy(); }
      break;
  }}catch(err){ console.error(err); }
});

/* ═══ বুট ═══ */
injectRail();
try{ const v0=$('#view'); if(v0) scanMentions(v0); }catch(e){}
console.log('✨ Autophagy New Features v1.0 loaded — Reels · Poll · Location · Close Friends · Mentions · Games · Calls · Privacy');
/* ═══════════ END PART 2 ═══════════ */

/* ═══════════ AUTOPHAGY UPGRADE PACK v2.0 ═══════════ */

/* ---- ১) কমিশন ৯.৫% — সব লেখা আপডেট ---- */
Object.assign(D.en,{az_wd_note:'Autophagy deducts a 9.5% commission from every payout.',az_comm_note:'Every network payout carries a 9.5% Autophagy commission — collected at withdrawal and sent to Autophagy PLC.',az_wd_ok:'Withdrawal requested — 9.5% commission collected',az_how_d:'1. Create a free account on any ad network (Adsterra, Monetag, TerraBox, AdSense, PropellerAds, HilltopAds, MGID…).\n2. Get your referral / promo / direct link.\n3. Add it here in the Earn Zone.\n4. Other Autophagy users from every country click your link.\n5. The ad network pays you directly — Autophagy keeps only a 9.5% commission.\n\n⚠️ Only share legitimate ad-network links. Spam links are sponged instantly.'});
Object.assign(D.bn,{az_wd_note:'প্রতিটি পেআউট থেকে অটোফজি ৯.৫% কমিশন কাটবে।',az_comm_note:'প্রতিটি নেটওয়ার্ক পেআউটে ৯.৫% অটোফজি কমিশন — উত্তোলনের সময় সংগ্রহ হয়ে অটোফজি পিএলসিতে যায়।',az_wd_ok:'উত্তোলনের অনুরোধ জমা — ৯.৫% কমিশন সংগ্রহ হয়েছে',az_how_d:'১. যেকোনো বৈধ অ্যাড নেটওয়ার্কে ফ্রি অ্যাকাউন্ট খুলুন (Adsterra, Monetag, PropellerAds, MGID…)।\n২. আপনার রেফারেল / প্রমো / ডিরেক্ট লিংক নিন।\n৩. এখানে আর্ন জোনে যোগ করুন।\n৪. সব দেশের অটোফজি ব্যবহারকারী আপনার লিংকে ক্লিক করবে।\n৫. নেটওয়ার্ক সরাসরি আপনাকে টাকা দেবে — অটোফজি রাখবে মাত্র ৯.৫% কমিশন।\n\n⚠️ শুধু বৈধ অ্যাড-নেটওয়ার্ক লিংক শেয়ার করুন।'});
const __apOAzWd=openAzWd;
openAzWd=function(){ __apOAzWd();
  setTimeout(()=>{ const fix=()=>{ const c=$('#azWdComm'); if(c&&c.textContent.indexOf('(5%)')>=0) c.textContent=c.textContent.replace('(5%)','(9.5%)'); };
    fix(); const a=$('#azAmt'); if(a) a.addEventListener('input',fix);
  },150);
};

/* ---- ২) ১২টা নতুন বৈধ অ্যাড নেটওয়ার্ক ---- */
if(typeof AD_NETS!=='undefined'&&typeof AD_NET_KEYS!=='undefined'){
  const AP_NEW_NETS={
    propellerads:{name:'PropellerAds',desc:'Push · Pop · Domain — worldwide',c:'#0E7490',ic:'🚀'},
    hilltopads:{name:'HilltopAds',desc:'Popunder · Video — high CPM',c:'#B4530A',ic:'⛰️'},
    clickadu:{name:'Clickadu',desc:'Popunder · Push — 240+ geos',c:'#5B3A82',ic:'⚡'},
    admaven:{name:'AdMaven',desc:'Pop · Push · Interstitial',c:'#8A2C4E',ic:'🌟'},
    galaksion:{name:'Galaksion',desc:'Popunder · Native — global',c:'#26437A',ic:'🌌'},
    richads:{name:'RichAds',desc:'Push · Pop — performance',c:'#0B6E4F',ic:'💎'},
    mgid:{name:'MGID',desc:'Native ads — premium',c:'#7C1D1D',ic:'📰'},
    revcontent:{name:'RevContent',desc:'Native content ads',c:'#3D5A26',ic:'🔄'},
    medianet:{name:'Media.net',desc:'Yahoo/Bing — AdSense alternative',c:'#0B0B16',ic:'🔎'},
    bidvertiser:{name:'Bidvertiser',desc:'Direct advertising since 2003',c:'#B4530A',ic:'📈'},
    popcash:{name:'PopCash',desc:'Popunder — fast payouts',c:'#5B3A82',ic:'💥'},
    aads:{name:'A-ADS',desc:'Anonymous Ads — crypto, no signup',c:'#55555F',ic:'₿'}
  };
  Object.keys(AP_NEW_NETS).forEach(k=>{ if(!AD_NETS[k]){ AD_NETS[k]=AP_NEW_NETS[k]; AD_NET_KEYS.push(k); } });
}

/* ---- ৩) ফুটারে 'আমার প্রোফাইল' → সোজা উপরে ---- */
document.addEventListener('click',e=>{
  if(e.target.closest('[data-act="nav_profile"]')) setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),150);
});

/* ---- ৪) স্থায়ী ভিডিও/মিডিয়া — IndexedDB স্টোরেজ ---- */
const APIDB={db:null};
function apIdb(){return new Promise(res=>{ if(APIDB.db)return res(APIDB.db); try{ const rq=indexedDB.open('autophagy_media',1); rq.onupgradeneeded=ev=>{ try{ev.target.result.createObjectStore('media');}catch(e){} }; rq.onsuccess=ev=>{APIDB.db=ev.target.result;res(APIDB.db);}; rq.onerror=()=>res(null); }catch(e){res(null);} });}
async function apIdbSet(k,blob){ const db=await apIdb(); if(!db)return false; return new Promise(res=>{ try{ const tx=db.transaction('media','readwrite'); tx.objectStore('media').put(blob,k); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){res(false);} });}
async function apIdbGet(k){ const db=await apIdb(); if(!db)return null; return new Promise(res=>{ try{ const rq=db.transaction('media').objectStore('media').get(k); rq.onsuccess=()=>res(rq.result||null); rq.onerror=()=>res(null); }catch(e){res(null);} });}
async function apPersistMedia(arr){ if(!Array.isArray(arr))return; for(const m of arr){ if(m&&typeof m.url==='string'&&m.url.startsWith('blob:')&&!m.idb){ try{ const blob=await fetch(m.url).then(r=>r.blob()); const key='apm_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); if(await apIdbSet(key,blob)) m.idb=key; }catch(e){} } } }
async function apHydrateMedia(){ let ch=false; const lists=[];
  (S.posts||[]).forEach(p=>{ if(p.media)lists.push(p.media); if(p.rMedia)lists.push(p.rMedia); });
  for(const arr of lists){ for(const m of arr){ if(m&&m.idb&&(!m.url||!m.url.startsWith('blob:'))){ const b=await apIdbGet(m.idb); if(b){ m.url=URL.createObjectURL(b); ch=true; } } } }
  return ch;
}
const __apOPub=publish;
publish=function(){ apPersistMedia(draftMedia).catch(()=>{}).finally(()=>{ try{ __apOPub(); }catch(e){console.error(e);} }); };

/* ---- ৫) ডান পাশে ৩টা সাইটওয়াইড অ্যাড ---- */
let apSideIdx=0;
function apSideRender(){
  const box=document.getElementById('apSideAds'); if(!box) return;
  const live=(typeof liveAds==='function')?liveAds():[];
  let cards='';
  if(live.length){
    cards=[0,1,2].map(i=>{ const a=live[(apSideIdx+i)%live.length];
      const mh=(a.media&&a.media.type==='image')?`<img src="${esc(a.media.url)}" style="width:100%;height:74px;object-fit:cover;display:block">`:'';
      return `<div class="apSideAd"><span class="adtype">AD</span>${mh}<div class="adv" style="background:${(typeof AD_STYLES!=='undefined'&&AD_STYLES[a.type])||'#0000AD'}"><b>${esc(a.brand)}</b></div></div>`;
    }).join('');
  }else{
    const promos=[
      {bg:'linear-gradient(135deg,#0000AD,#26265F)',h:'📢',t1:t('your_ad'),t2:t('ad_sub').slice(0,70),act:'openAds'},
      {bg:'linear-gradient(135deg,#0B6E4F,#0E7490)',h:'💰',t1:t('az_t'),t2:t('az_cta'),act:'nav_adzone'},
      {bg:'linear-gradient(135deg,#8A2C4E,#C0195B)',h:'🎬',t1:t('reels'),t2:t('reels_sub').slice(0,55),act:'openReels'}
    ];
    cards=promos.map(p=>`<button class="apSideAd" data-act="${p.act}"><span class="adtype">AD</span><div class="adv" style="background:${p.bg}"><span style="font-size:22px">${p.h}</span><b>${esc(p.t1)}</b><span style="font-size:11.5px;opacity:.85">${esc(p.t2)}</span></div></button>`).join('');
  }
  box.innerHTML=cards;
}
function startSideAds(){
  if(document.getElementById('apSideAds')) return;
  const d=document.createElement('div'); d.id='apSideAds'; document.body.appendChild(d);
  apSideRender();
  setInterval(()=>{ apSideIdx+=3; apSideRender(); },9000);
}

/* ---- ৬) ফিড স্লাইডার — কমপক্ষে ৫টা স্লাইড ---- */
function apDefaultSlides(){
  const mk=(bg,h,b,s,act)=>`<div class="adslide"><span class="adtype">AD</span><div class="adv" style="background:${bg};cursor:pointer" data-act="${act}"><b>${h} ${esc(b)}</b><span style="font-size:13px;opacity:.85">${esc(s.slice(0,90))}</span><span class="btn sm" style="align-self:flex-start;margin-top:6px">${esc(t('open'))} →</span></div></div>`;
  return [
    mk('linear-gradient(120deg,#0000AD,#26265F)','📢',t('your_ad'),t('ad_sub'),'openAds'),
    mk('linear-gradient(120deg,#0B6E4F,#0E7490)','💰',t('az_t'),t('az_sub'),'nav_adzone'),
    mk('linear-gradient(120deg,#8A2C4E,#C0195B)','🎬',t('reels'),t('reels_sub'),'openReels'),
    mk('linear-gradient(120deg,#B4530A,#7C1D1D)','🎮',t('games'),t('games_sub'),'openGames'),
    mk('linear-gradient(120deg,#26437A,#5B3A82)','🌐',t('tr_note'),t('langsNote'),'langToggle')
  ];
}
const __apRF2=renderFeed;
renderFeed=function(){ __apRF2();
  try{
    const slot=document.querySelector('#view .adslot'); if(!slot) return;
    let box=document.getElementById('adBox');
    if(!box){
      const defs=apDefaultSlides();
      box=document.createElement('div'); box.id='adBox'; box.className='adslider';
      box.innerHTML=defs.join('')+`<button class="adarrow l" data-act="adPrev">‹</button><button class="adarrow r" data-act="adNext">›</button><div class="adnav">${defs.map((_,i)=>`<button data-act="adDot" data-i="${i}"${i===0?' class="on"':''}></button>`).join('')}</div>`;
      const card=slot.querySelector('.adcard2');
      if(card){ card.style.display='none'; card.after(box); } else slot.prepend(box);
      if(typeof startAdSlider==='function') startAdSlider();
    }else{
      const slides=$$('#adBox .adslide');
      if(slides.length<5&&!box.dataset.apPad){
        box.dataset.apPad='1';
        const defs=apDefaultSlides().slice(0,5-slides.length);
        const nav=box.querySelector('.adnav');
        defs.forEach(h=>{ if(nav) nav.insertAdjacentHTML('beforebegin',h); else box.insertAdjacentHTML('beforeend',h); });
        if(nav){ const all=$$('#adBox .adslide'); nav.innerHTML=all.map((_,i)=>`<button data-act="adDot" data-i="${i}"></button>`).join(''); }
        if(typeof adSlideGo==='function') adSlideGo(0);
      }
    }
  }catch(e){}
};

/* ---- ৭) অথরিটি প্যানেল — লোগো + প্রতিষ্ঠাতার ছবি (শুধু PIN দিয়ে) ---- */
S.brand=S.brand||{logo:null};
let apAuthOk=false, apFounderImg=null;
function apPickImg(cb){ const inp=$('#fin'); inp.accept='image/*'; inp.onchange=()=>{ const f=inp.files[0]; if(!f)return; inp.value=''; const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); const sc=Math.min(1,420/im.width); c.width=im.width*sc; c.height=im.height*sc; c.getContext('2d').drawImage(im,0,0,c.width,c.height); cb(c.toDataURL('image/png',0.92)); }; im.src=URL.createObjectURL(f); }; inp.click(); }
function apApplyLogo(){ try{ const lb=$('#logoBox'); if(lb&&S.brand.logo) lb.innerHTML='<img src="'+S.brand.logo+'" alt="Autophagy" style="width:100%;height:100%;object-fit:cover">'; }catch(e){} }
const __apRHdr=renderHeader;
renderHeader=function(){ __apRHdr(); apApplyLogo(); };
function apAuthPanel(){
  if(!apAuthOk){
    modal(`<h3>🔐 Authority Access</h3><p class="sub">${esc(t('ad_pin'))}</p>
     <div class="field pinrow"><input id="apAuthPin" inputmode="numeric" maxlength="6" placeholder="••••"><button class="btn sm" data-act="apAuthGo">${ic('lock')}</button></div>`);
    return;
  }
  const fImg=apFounderImg||(S.about&&S.about.img)||null;
  modal(`<h3>🏛️ Authority Panel</h3><p class="sub">${esc(t('logo_chg'))} · প্রতিষ্ঠাতা</p>
   <div class="adcard"><span class="tag">🏷️ LOGO</span>
     ${S.brand.logo?`<img src="${S.brand.logo}" style="max-height:70px;border-radius:8px;display:block;margin-bottom:8px">`:''}
     <button class="btn ghost sm" data-act="apLogoUp">${ic('img')}${esc(t('logo_chg'))}</button></div>
   <div class="adcard" style="margin-top:12px"><span class="tag">👤 প্রতিষ্ঠাতা (About-এ দেখাবে)</span>
     ${fImg?`<img src="${fImg}" style="max-height:90px;border-radius:50%;display:block;margin:8px auto">`:''}
     <div class="field" style="margin:8px 0"><label>${esc(t('ph_name'))}</label><input id="apFName" value="${esc((S.about&&S.about.name)||'')}"></div>
     <div class="field"><label>${esc(t('about_ph'))}</label><textarea id="apFText" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;min-height:70px">${esc((S.about&&S.about.text)||'')}</textarea></div>
     <button class="btn ghost sm" data-act="apFounderUp">${ic('img')}${esc(t('az_img_pick'))}</button></div>
   <button class="btn" style="width:100%;justify-content:center;margin-top:14px" data-act="apAuthSave">${ic('check')}${esc(t('save'))}</button>`);
}
function apAuthBtnInject(){
  const cols=document.querySelectorAll('footer .ft-col'); if(!cols[1]) return;
  if(cols[1].querySelector('[data-act="apAuth"]')) return;
  const b=document.createElement('button'); b.dataset.act='apAuth'; b.textContent='🏛️ Authority';
  cols[1].appendChild(b);
}

/* ---- ৮) ট্র্যাকড শেয়ার লিংক — ক্লিক কাউন্ট + কমিশন ---- */
const AP_AUTH_WA={phone:'',apikey:''}; /* চাইলে CallMeBot key বসাও — প্রতি বাইরের ক্লিকে WhatsApp নোটিশ যাবে */
function apTrackedUrl(l){ const base=location.href.split('?')[0].split('#')[0]; return base+'?apgo='+encodeURIComponent(l.id)+'&u='+encodeURIComponent(l.url); }
const __apAzCopy=azCopyLink;
azCopyLink=function(url){ const l=(S.adLinks||[]).find(x=>x.url===url); const out=l?apTrackedUrl(l):url;
  if(navigator.clipboard) navigator.clipboard.writeText(out).catch(()=>{});
  toast(t('share_ok')+' 📈','share'); };
const __apRAZ=renderAdZone;
renderAdZone=function(){ __apRAZ();
  try{ $$('#view a.azlink-img').forEach(a=>{ const l=(S.adLinks||[]).find(x=>x.url===a.getAttribute('href')); if(l) a.setAttribute('href',apTrackedUrl(l)); }); }catch(e){}
};

/* ---- নতুন ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'apAuth': apAuthPanel(); break;
    case 'apAuthGo':
      if($('#apAuthPin').value.trim()===ADMIN_PIN){ apAuthOk=true; toast(t('admin_ok'),'lock'); apAuthPanel(); }
      else toast(t('err_code'),'alert');
      break;
    case 'apLogoUp': apPickImg(d=>{ S.brand.logo=d; save(); apApplyLogo(); toast(t('logo_ok'),'check'); apAuthPanel(); }); break;
    case 'apFounderUp': apPickImg(d=>{ apFounderImg=d; apAuthPanel(); }); break;
    case 'apAuthSave':
      S.about={name:$('#apFName')?$('#apFName').value.trim():'',text:$('#apFText')?$('#apFText').value.trim():'',img:apFounderImg||(S.about&&S.about.img)||null};
      apFounderImg=null; save(); toast(t('saved'),'check'); apAuthPanel();
      break;
  }}catch(err){ console.error(err); }
});

/* ---- ৯) ট্র্যাকড লিংক খুললে: কাউন্ট + কমিশন + রিডাইরেক্ট ---- */
(function(){ try{
  const q=new URLSearchParams(location.search);
  const id=q.get('apgo'), u=q.get('u');
  if(!id&&!u) return;
  const l=id?(S.adLinks||[]).find(x=>x.id===id):null;
  const target=(u?decodeURIComponent(u):null)||(l&&l.url);
  if(!target) return;
  if(l){ l.clicks=(l.clicks||0)+1;
    const est=(typeof AZ_EST_CPC!=='undefined'?AZ_EST_CPC:0.01)*(typeof AZ_COMM_RATE!=='undefined'?AZ_COMM_RATE:0.095);
    S.azComm=(S.azComm||0)+est; save();
    if(AP_AUTH_WA.phone&&AP_AUTH_WA.apikey){ try{ fetch('https://api.callmebot.com/whatsapp.php?phone='+encodeURIComponent(AP_AUTH_WA.phone)+'&text='+encodeURIComponent('💰 Earn Zone click — est. commission +$'+est.toFixed(5)+' — '+(l.title||''))+'&apikey='+encodeURIComponent(AP_AUTH_WA.apikey)).catch(()=>{}); }catch(e){} }
  }
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:#0000AD;z-index:99999;display:grid;place-items:center;color:#fff;text-align:center;padding:24px;font-family:Georgia,serif';
  ov.innerHTML='<div><div style="font-size:36px">🔗</div><div style="font-size:22px;margin-top:8px">Autophagy Earn Zone</div><div style="font-size:13.5px;opacity:.8;margin-top:6px">Opening secure link…</div></div>';
  document.body.appendChild(ov);
  setTimeout(()=>{ try{ location.replace(target); }catch(e){} },900);
}catch(e){} })();

/* ---- বুট ---- */
startSideAds();
apAuthBtnInject();
apApplyLogo();
apHydrateMedia().then(ch=>{ if(ch&&view==='feed') renderFeed(); });
console.log('✅ Autophagy Upgrade Pack v2.0 — 9.5% · Authority Panel · Persistent Media · Side Ads · Tracked Shares');
/* ═══════════ END v2 ═══════════ */

/* ═══════════ v2.1 SAFE — লোগো + ফেভিকন + প্রতিষ্ঠাতা ═══════════ */
try{
  S.brand=S.brand||{};
  if(!S.brand.logo) S.brand.logo='images/logo.png';
  S.about=S.about||{};
  if(!S.about.img) S.about.img='images/founder.jpg';
  if(!S.about.name) S.about.name='Tapos Das';
  if(typeof save==='function') save();
}catch(e){console.warn('v2.1 setup:',e)}

try{
  apApplyLogo=function(){ try{ const lb=document.getElementById('logoBox');
    if(lb&&S.brand.logo) lb.innerHTML='<img src="'+S.brand.logo+'" alt="Autophagy" style="width:100%;height:100%;object-fit:contain;background:#fff;border-radius:6px;padding:2px">';
  }catch(e){} };
  apApplyLogo();
}catch(e){console.warn('v2.1 logo:',e)}

try{
  document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]').forEach(x=>x.remove());
  const l=document.createElement('link');
  l.rel='icon'; l.type='image/png';
  l.href='images/logo.png?v='+Date.now();
  document.head.appendChild(l);
}catch(e){}
try{ const fb=document.querySelector('.ft-brand');
  if(fb&&!fb.querySelector('.apFLogo')){
    const im=document.createElement('img'); im.src=S.brand.logo; im.className='apFLogo'; im.alt='Autophagy';
    im.style.cssText='width:72px;height:72px;object-fit:contain;display:block;margin-bottom:10px';
    fb.prepend(im);
  }
}catch(e){}

try{ const sm=document.querySelector('.sp-mark');
  if(sm&&!sm.querySelector('img')) sm.insertAdjacentHTML('afterbegin','<img src="'+S.brand.logo+'" style="width:76px;height:76px;object-fit:contain;display:block;margin:0 auto 10px">');
}catch(e){}

console.log('🖼️ v2.1 — Logo & Founder image wired');
/* ═══════════ END v2.1 ═══════════ */

/* ═══════════ v2.3 — সঠিক ফাইলনাম ফিক্স ═══════════ */
S.brand=S.brand||{}; S.about=S.about||{};
S.brand.logo='images/logo.png.png';
S.about.img='images/founder.jpg.png';
if(typeof save==='function') save();

(function(){ try{ const lb=document.getElementById('logoBox');
  if(lb) lb.innerHTML='<img src="'+S.brand.logo+'" alt="Autophagy" style="width:100%;height:100%;object-fit:contain;background:#fff;border-radius:6px;padding:2px">';
}catch(e){} })();

(function(){ try{
  document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]').forEach(x=>x.remove());
  const l=document.createElement('link'); l.rel='icon'; l.type='image/png';
  l.href=S.brand.logo+'?v=3'; document.head.appendChild(l);
}catch(e){} })();

(function(){ try{ const fb=document.querySelector('.ft-brand');
  if(fb){ const o=fb.querySelector('.apFLogo'); if(o)o.remove();
    const im=document.createElement('img'); im.src=S.brand.logo; im.className='apFLogo';
    im.style.cssText='width:72px;height:72px;object-fit:contain;display:block;margin-bottom:10px';
    fb.prepend(im); }
}catch(e){} })();

(function(){ try{ const sm=document.querySelector('.sp-mark');
  if(sm){ const o=sm.querySelector('img'); if(o)o.remove();
    sm.insertAdjacentHTML('afterbegin','<img src="'+S.brand.logo+'" style="width:76px;height:76px;object-fit:contain;display:block;margin:0 auto 10px">'); }
}catch(e){} })();

console.log('🖼️ v2.3 — logo:',S.brand.logo,'| founder:',S.about.img);
/* ═══════════ END v2.3 ═══════════ */

/* ═══════════ v2.4 — নতুন লোগো (logo2.png) + বড় হেডার + ফেভিকন ═══════════ */
S.brand=S.brand||{};
S.brand.logo='images/logo2.png.png';
if(typeof save==='function') save();

/* হেডারের লোগো বক্স বড় করো (স্কয়ার লোগোর জন্য) */
(function(){ try{
  let st=document.getElementById('apLogoCSS');
  if(!st){ st=document.createElement('style'); st.id='apLogoCSS'; document.head.appendChild(st); }
  st.textContent='#logoBox{width:50px !important;height:50px !important;border-radius:12px !important;box-shadow:0 2px 8px rgba(0,0,0,.25) !important}'
   +'@media(max-width:860px){#logoBox{width:42px !important;height:42px !important}}';
}catch(e){} })();

/* সব জায়গায় নতুন লোগো বসাও */
(function(){ try{
  const lb=document.getElementById('logoBox');
  if(lb) lb.innerHTML='<img src="'+S.brand.logo+'" alt="Autophagy" style="width:100%;height:100%;object-fit:cover;border-radius:12px;display:block">';
}catch(e){} })();

/* ফেভিকন — ক্যাশ-বাস্টসহ */
(function(){ try{
  document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(x=>x.remove());
  const l=document.createElement('link'); l.rel='icon'; l.type='image/png';
  l.href=S.brand.logo+'?v=4'; document.head.appendChild(l);
  const a=document.createElement('link'); a.rel='apple-touch-icon'; a.href=S.brand.logo+'?v=4';
  document.head.appendChild(a);
}catch(e){} })();

/* ফুটারে লোগো */
(function(){ try{ const fb=document.querySelector('.ft-brand');
  if(fb){ const o=fb.querySelector('.apFLogo'); if(o)o.remove();
    const im=document.createElement('img'); im.src=S.brand.logo; im.className='apFLogo'; im.alt='Autophagy';
    im.style.cssText='width:84px;height:84px;object-fit:cover;border-radius:16px;display:block;margin-bottom:12px;box-shadow:0 4px 14px rgba(0,0,0,.2)';
    fb.prepend(im); }
}catch(e){} })();

/* স্প্ল্যাশ স্ক্রিনে লোগো */
(function(){ try{ const sm=document.querySelector('.sp-mark');
  if(sm){ const o=sm.querySelector('img'); if(o)o.remove();
    sm.insertAdjacentHTML('afterbegin','<img src="'+S.brand.logo+'" style="width:92px;height:92px;object-fit:cover;border-radius:20px;display:block;margin:0 auto 12px;box-shadow:0 8px 26px rgba(0,0,0,.35)">'); }
}catch(e){} })();

console.log('🖼️ v2.4 — নতুন লোগো বসানো হয়েছে:',S.brand.logo);
/* ═══════════ END v2.4 ═══════════ */
/* ═══════════ v2.5 — নতুন লোগো অটো-ডিটেক্ট + বড় হেডার + ফেভিকন ═══════════ */
function apFindImg2(cands){
  return new Promise(res=>{ let i=0;
    const t=()=>{ if(i>=cands.length) return res(null);
      const im=new Image(); im.onload=()=>res(cands[i]); im.onerror=()=>{i++;t();}; im.src=cands[i]; };
    t();
  });
}
(async function(){
  try{
    const found = await apFindImg2(['images/logo2.png.png','images/logo2.png','images/logo2.PNG','images/logo2.jpg','images/logo2.jpeg','images/logo2.webp','images/logo.png','images/logo.png.png']);
    if(!found){ console.warn('⚠️ v2.5 — কোনো লোগো পাওয়া যায়নি! GitHub-এ images ফোল্ডার দেখো'); return; }
    S.brand=S.brand||{}; S.brand.logo=found;
    if(typeof save==='function') save();

    /* হেডার বক্স বড় + স্কয়ার */
    (function(){ try{
      let st=document.getElementById('apLogoCSS');
      if(!st){ st=document.createElement('style'); st.id='apLogoCSS'; document.head.appendChild(st); }
      st.textContent='#logoBox{width:50px !important;height:50px !important;border-radius:12px !important;box-shadow:0 2px 8px rgba(0,0,0,.25) !important}'
       +'@media(max-width:860px){#logoBox{width:42px !important;height:42px !important}}';
    }catch(e){} })();

    /* হেডারে */
    (function(){ try{ const lb=document.getElementById('logoBox');
      if(lb) lb.innerHTML='<img src="'+S.brand.logo+'" alt="Autophagy" style="width:100%;height:100%;object-fit:cover;border-radius:12px;display:block">';
    }catch(e){} })();

    /* ফেভিকন */
    (function(){ try{
      document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(x=>x.remove());
      const l=document.createElement('link'); l.rel='icon'; l.type='image/png';
      l.href=S.brand.logo+'?v=5'; document.head.appendChild(l);
      const a=document.createElement('link'); a.rel='apple-touch-icon'; a.href=S.brand.logo+'?v=5';
      document.head.appendChild(a);
    }catch(e){} })();

    /* ফুটারে */
    (function(){ try{ const fb=document.querySelector('.ft-brand');
      if(fb){ const o=fb.querySelector('.apFLogo'); if(o)o.remove();
        const im=document.createElement('img'); im.src=S.brand.logo; im.className='apFLogo'; im.alt='Autophagy';
        im.style.cssText='width:84px;height:84px;object-fit:cover;border-radius:16px;display:block;margin-bottom:12px;box-shadow:0 4px 14px rgba(0,0,0,.2)';
        fb.prepend(im); }
    }catch(e){} })();

    /* স্প্ল্যাশে */
    (function(){ try{ const sm=document.querySelector('.sp-mark');
      if(sm){ const o=sm.querySelector('img'); if(o)o.remove();
        sm.insertAdjacentHTML('afterbegin','<img src="'+S.brand.logo+'" style="width:92px;height:92px;object-fit:cover;border-radius:20px;display:block;margin:0 auto 12px;box-shadow:0 8px 26px rgba(0,0,0,.35)">'); }
    }catch(e){} })();

    console.log('🖼️ v2.5 — লোগো বসানো হয়েছে:',S.brand.logo);
  }catch(e){ console.warn('v2.5:',e); }
})();
/* ═══════════ END v2.5 ═══════════ */

/* ═══════════ v2.6 — রিল আপলোড · নেটওয়ার্ক চিপস · মোবাইল সাইডঅ্যাড · পপ · স্লাইডার-৫ ═══════════ */

/* ---- ১) রিল আপলোড ---- */
let apRelVid=null;
function openReelUp(){
  if(!me()) return openAuth('login');
  apRelVid=null;
  modal(`<h3>🎬 ${esc(t('reels'))} — আপলোড</h3><p class="sub">${esc(t('reels_sub'))}</p>
   <div class="azcard"><span class="tag">📹 ভিডিও</span>
     <div class="azfield"><button class="btn ghost sm" data-act="relVidPick" type="button">${ic('vid')}${esc(t('video'))} সিলেক্ট করো</button>
     <div id="relVidPrev" style="margin-top:10px"></div></div>
     <div class="azfield"><label>ক্যাপশন / ${esc(t('az_desc'))}</label><textarea id="relCap" placeholder="${esc(t('ph_comp'))}"></textarea></div>
   </div>
   <button class="btn" style="width:100%;justify-content:center" data-act="relGo">${ic('send')}${esc(t('publish'))}</button>`);
}
function pickReelVid(){
  const inp=$('#fin'); inp.accept='video/*';
  inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; inp.value='';
    const done=()=>{ const pv=$('#relVidPrev'); if(pv) pv.innerHTML=apRelVid?'<video src="'+apRelVid.url+'" controls style="max-height:160px;border-radius:10px;width:100%;background:#000"></video>':''; };
    if(f.size<=1200000){ const rd=new FileReader(); rd.onload=()=>{ apRelVid={type:'video',url:rd.result}; done(); }; rd.readAsDataURL(f); }
    else{ apRelVid={type:'video',url:URL.createObjectURL(f),sess:true}; toast(t('large_file'),'alert'); done(); }
  }; inp.click();
}
function publishReel(){
  const u=me(); if(!u) return openAuth('login');
  if(!apRelVid){ toast('⚠️ আগে ভিডিও সিলেক্ট করো','alert'); return; }
  draftText=$('#relCap')?$('#relCap').value.trim():'';
  draftMedia=[apRelVid]; draftEmo=draftEmo||'story';
  apRelVid=null; closeModal(); go('feed');
  setTimeout(()=>{ try{ publish(); }catch(e){ console.error(e); } },250);
}
const __apRR=renderReels;
renderReels=function(){ __apRR();
  try{ const w=document.querySelector('.reels-wrap');
    if(w&&!document.getElementById('apRelUpBtn')){
      const b=document.createElement('button'); b.id='apRelUpBtn'; b.className='btn'; b.dataset.act='openReelUp';
      b.style.cssText='width:100%;justify-content:center;margin-bottom:6px';
      b.innerHTML=ic('vid')+' নতুন রিল আপলোড করো';
      w.insertBefore(b,w.firstChild);
    }
  }catch(e){}
};

/* ---- ২) নেটওয়ার্ক নিশ্চিত + আর্ন জোনে চিপস ---- */
(function(){ try{
  const NEW={propellerads:{name:'PropellerAds',desc:'Push · Pop · Domain — worldwide',c:'#0E7490',ic:'🚀'},hilltopads:{name:'HilltopAds',desc:'Popunder · Video — high CPM',c:'#B4530A',ic:'⛰️'},clickadu:{name:'Clickadu',desc:'Popunder · Push — 240+ geos',c:'#5B3A82',ic:'⚡'},admaven:{name:'AdMaven',desc:'Pop · Push · Interstitial',c:'#8A2C4E',ic:'🌟'},galaksion:{name:'Galaksion',desc:'Popunder · Native — global',c:'#26437A',ic:'🌌'},richads:{name:'RichAds',desc:'Push · Pop — performance',c:'#0B6E4F',ic:'💎'},mgid:{name:'MGID',desc:'Native ads — premium',c:'#7C1D1D',ic:'📰'},revcontent:{name:'RevContent',desc:'Native content ads',c:'#3D5A26',ic:'🔄'},medianet:{name:'Media.net',desc:'Yahoo/Bing — AdSense alternative',c:'#0B0B16',ic:'🔎'},bidvertiser:{name:'Bidvertiser',desc:'Direct advertising since 2003',c:'#B4530A',ic:'📈'},popcash:{name:'PopCash',desc:'Popunder — fast payouts',c:'#5B3A82',ic:'💥'},aads:{name:'A-ADS',desc:'Anonymous Ads — crypto, no signup',c:'#55555F',ic:'₿'}};
  if(typeof AD_NETS!=='undefined'&&typeof AD_NET_KEYS!=='undefined'){
    Object.keys(NEW).forEach(k=>{ if(!AD_NETS[k]){ AD_NETS[k]=NEW[k]; if(!AD_NET_KEYS.includes(k)) AD_NET_KEYS.push(k); } });
  }
  console.log('💰 Earn Zone networks total:',(typeof AD_NET_KEYS!=='undefined'?AD_NET_KEYS.length:'?'));
}catch(e){} })();
const __apRAZ2=renderAdZone;
renderAdZone=function(){ __apRAZ2();
  try{
    const how=document.querySelector('#view .azhow'); if(!how||document.getElementById('apNetChips')) return;
    let html='<div id="apNetChips"><div class="panelab" style="margin-bottom:8px">🌐 '+AD_NET_KEYS.length+' NETWORKS — যেকোনোটায় লিংক যোগ করো</div><div style="display:flex;gap:7px;flex-wrap:wrap">';
    AD_NET_KEYS.forEach(k=>{ const n=AD_NETS[k]; if(n) html+='<span class="aztag" style="background:'+n.c+'">'+n.ic+' '+esc(n.name)+'</span>'; });
    html+='</div></div>';
    how.insertAdjacentHTML('afterend',html);
  }catch(e){}
};

/* ---- ৩) মোবাইল সাইড-অ্যাড স্ট্রিপ (ডেস্কটপের সাথে সিঙ্ক) ---- */
(function(){ try{
  const mk=()=>{ let m=document.getElementById('apSideAdsM');
    if(!m){ m=document.createElement('div'); m.id='apSideAdsM';
      const wr=document.querySelector('.wrap'); if(wr&&wr.parentNode) wr.parentNode.insertBefore(m,wr); else document.body.appendChild(m); }
    return m; };
  const sync=()=>{ try{ const d=document.getElementById('apSideAds'),m=mk();
    if(d&&d.innerHTML&&m.innerHTML!==d.innerHTML) m.innerHTML=d.innerHTML; }catch(e){} };
  sync(); setInterval(sync,3000);
}catch(e){} })();

/* ---- ৪) স্লাইডার-৫ নিশ্চিত + লগ ---- */
const __apRF3=renderFeed;
renderFeed=function(){ __apRF3();
  try{
    if(typeof apDefaultSlides!=='function') return;
    const slot=document.querySelector('#view .adslot'); if(!slot) return;
    let box=document.getElementById('adBox');
    if(!box){
      const defs=apDefaultSlides();
      box=document.createElement('div'); box.id='adBox'; box.className='adslider';
      box.innerHTML=defs.join('')+'<button class="adarrow l" data-act="adPrev">‹</button><button class="adarrow r" data-act="adNext">›</button><div class="adnav">'+defs.map((_,i)=>'<button data-act="adDot" data-i="'+i+'"'+(i===0?' class="on"':'')+'></button>').join('')+'</div>';
      const card=slot.querySelector('.adcard2');
      if(card){ card.style.display='none'; card.after(box); } else slot.prepend(box);
      if(typeof startAdSlider==='function') startAdSlider();
    }
    console.log('🎞️ Feed slider slides:',$$('#adBox .adslide').length);
  }catch(e){}
};

/* ---- ৫) ডেমো পপ (প্রতি সেশনে ১ বার, ৯ সেকেন্ড পর) ---- */
setTimeout(()=>{ try{
  if(document.getElementById('adPop')) return;
  if(liveAds().some(a=>placeOf(a)==='pop')) return;
  if(sessionStorage.getItem('apPopDone')) return;
  const el=document.createElement('div'); el.className='adpop large'; el.id='adPop';
  el.innerHTML='<button class="apx" data-act="popClose">✕</button>'
   +'<div class="adv" style="background:linear-gradient(120deg,#0000AD,#26265F);cursor:pointer" data-act="openAds"><b>📢 '+esc(t('your_ad'))+'</b>'
   +'<span style="font-size:12.5px;opacity:.85">'+esc(t('ad_sub'))+'</span>'
   +'<span class="btn sm" style="align-self:flex-start;margin-top:6px">📤 '+esc(t('advertise'))+'</span></div>'
   +'<div class="ameta"><span>AUTOPHAGY ADS</span><span>AD</span></div>';
  document.body.appendChild(el);
  sessionStorage.setItem('apPopDone','1');
}catch(e){} },9000);

/* ---- ৬) ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'openReelUp': openReelUp(); break;
    case 'relVidPick': pickReelVid(); break;
    case 'relGo': publishReel(); break;
  }}catch(err){ console.error(err); }
});

console.log('✨ v2.6 ready — রিল আপলোড · নেটওয়ার্ক চিপস · মোবাইল সাইডঅ্যাড · পপ · স্লাইডার-৫');
/* ═══════════ END v2.6 ═══════════ */

/* ═══════════ v2.7 — ১২ নেটওয়ার্কে ডেমো লিংক + স্পিড বুস্ট ═══════════ */

/* ---- A) নতুন ১২ নেটওয়ার্কে অফিসিয়াল ডেমো লিংক ---- */
(function(){ try{
  const DEMO={
    propellerads:['https://propellerads.com/','PropellerAds — Official'],
    hilltopads:['https://hilltopads.net/','HilltopAds — Official'],
    clickadu:['https://clickadu.com/','Clickadu — Official'],
    admaven:['https://admaven.com/','AdMaven — Official'],
    galaksion:['https://galaksion.com/','Galaksion — Official'],
    richads:['https://richads.com/','RichAds — Official'],
    mgid:['https://www.mgid.com/','MGID — Official'],
    revcontent:['https://revcontent.com/','RevContent — Official'],
    medianet:['https://www.media.net/','Media.net — Official'],
    bidvertiser:['https://www.bidvertiser.com/','Bidvertiser — Official'],
    popcash:['https://popcash.net/','PopCash — Official'],
    aads:['https://a-ads.com/','A-ADS — Official']
  };
  if(typeof AD_NETS==='undefined'||typeof uid!=='function') return;
  S.adLinks=S.adLinks||[];
  let n=0;
  Object.keys(DEMO).forEach(k=>{
    if(!AD_NETS[k]) return;
    if(S.adLinks.some(l=>l.net===k)) return;
    S.adLinks.push({id:uid(),by:'demo',net:k,url:DEMO[k][0],title:DEMO[k][1],
      desc:'Official website — নিজের রেফারেল লিংক যোগ করে আয় করো',img:null,clicks:0,ts:Date.now()-n*60000,demo:true});
    n++;
  });
  if(n&&typeof save==='function'){ save(); }
  console.log('💰 v2.7 — '+n+' নেটওয়ার্কে অফিসিয়াল ডেমো লিংক যোগ হলো');
}catch(e){ console.warn('v2.7 demo:',e); } })();

/* ---- B) স্পিড বুস্ট ১: save() ডিবাউন্স (সবচেয়ে বড় গতি-বাড়ানো!) ---- */
try{
  const __apSaveO=save; let apSavePend=false;
  save=function(){ if(apSavePend) return; apSavePend=true;
    setTimeout(()=>{ apSavePend=false; try{__apSaveO();}catch(e){} },900); };
  window.__apSaveO=__apSaveO;
  window.addEventListener('beforeunload',()=>{ try{ if(window.__apSaveO) window.__apSaveO(); }catch(e){} });
  document.addEventListener('visibilitychange',()=>{ try{ if(document.hidden&&window.__apSaveO) window.__apSaveO(); }catch(e){} });
  console.log('⚡ v2.7 — save() ডিবাউন্স চালু (লাইক/ক্লিক এখন ঝড়ের গতিতে!)');
}catch(e){ console.warn('v2.7 speed:',e); }

console.log('✨ v2.7 ready — ডেমো লিংক + স্পিড বুস্ট');
/* ═══════════ END v2.7 ═══════════ */

/* ═══════════ v2.8 — মনিটাইজেশন শর্ত · নিয়ন্ত্রিত উত্তোলন · কর্তৃপক্ষ অনুমোদন · জব্দ-পুল ═══════════ */

/* শর্তগুলো এখানে — পরে বদলাতে চাইলে শুধু সংখ্যা বদলাও */
const AP_WD={MIN_EARN:20,MIN_POSTS:395,MIN_READS:99000,MIN_ENGAGE:25,AUTH_EMAIL:'tautophagy@gmail.com'};
S.apWds=S.apWds||[]; S.apForfeit=S.apForfeit||0;
let apWdShot=null, apWdData=null;

/* ---- হিসাব ---- */
function apWdStats(){
  const posts=(S.posts||[]).filter(p=>p.author==='me');
  let reads=0,likes=0,cmts=0,shares=0,net=0;
  posts.forEach(p=>{ reads+=(p.reads&&p.reads.total)||0;
    likes+=Array.isArray(p.likes)?p.likes.length:(p.likes||0);
    (p.comments||[]).forEach(c=>{cmts+=1+((c.replies||[]).length);});
    shares+=p.shares||0; try{net+=earnOf(p).n;}catch(e){} });
  const eng=reads?((likes+cmts+shares)/reads*100):0;
  return {posts:posts.length,reads,likes,cmts,shares,eng,net};
}
function apWdAvail(){
  const st=apWdStats();
  const used=(S.wds||[]).reduce((s,w)=>s+(+w.amt||0),0)+S.apWds.filter(w=>w.status!=='rejected').reduce((s,w)=>s+(+w.amt||0),0);
  return Math.max(0,Math.round((st.net-used)*100)/100);
}
function apWdElig(){
  const st=apWdStats(), av=apWdAvail();
  const c=[
    {l:'💰 সর্বনিম্ন আয়',v:money(av)+' / '+money(AP_WD.MIN_EARN),p:Math.min(100,av/AP_WD.MIN_EARN*100),ok:av>=AP_WD.MIN_EARN},
    {l:'📝 ন্যূনতম পোস্ট',v:st.posts+' / '+AP_WD.MIN_POSTS,p:Math.min(100,st.posts/AP_WD.MIN_POSTS*100),ok:st.posts>=AP_WD.MIN_POSTS},
    {l:'👁 মোট পাঠ',v:fmt(st.reads)+' / '+fmt(AP_WD.MIN_READS),p:Math.min(100,st.reads/AP_WD.MIN_READS*100),ok:st.reads>=AP_WD.MIN_READS},
    {l:'❤️ এনগেজমেন্ট রেট',v:st.eng.toFixed(1)+'% / '+AP_WD.MIN_ENGAGE+'%',p:Math.min(100,st.eng/AP_WD.MIN_ENGAGE*100),ok:st.eng>=AP_WD.MIN_ENGAGE}
  ];
  return {ok:c.every(x=>x.ok),c:c};
}

/* ---- ইউজার উত্তোলন (পুরনো openWithdraw-কে নতুন নিয়মে প্রতিস্থাপন) ---- */
function openApWithdraw(){
  if(!me()) return openAuth('login');
  const E=apWdElig();
  const myReqs=S.apWds.filter(w=>w.by==='me').slice(0,6);
  const stx={pending:['⏳ অপেক্ষমাণ','pending'],approved:['✅ অনুমোদিত','live'],rejected:['❌ বাতিল — জব্দ','rejected']};
  if(!E.ok){
    modal(`<h3>🔒 ${esc(t('wd_t'))} — মনিটাইজেশন শর্ত</h3>
     <p class="sub">উত্তোলনের আগে নিচের শর্তগুলো পূরণ করতে হবে:</p>
     ${E.c.map(x=>`<div style="margin:10px 0"><div class="money-row"><span>${x.l}</span><b style="color:${x.ok?'#0B6E4F':'#B4530A'}">${x.v} ${x.ok?'✅':'⏳'}</b></div><div class="meter"><i style="width:${x.p}%"></i></div></div>`).join('')}
     <p style="font-size:12.5px;color:var(--mut);margin-top:8px">💡 বেশি লিখো, বন্ধুদের জড়াও, শেয়ার করো — শর্ত পূরণ হলেই এই দরজা খুলবে!</p>
     ${myReqs.length?`<h5 class="panelab" style="margin:14px 0 4px">আমার আবেদনসমূহ</h5>${myReqs.map(w=>`<div class="rowline"><div class="tt"><div class="sn mono">${money(w.amt)} · ${esc(w.method)}</div></div><span class="adstat ${stx[w.status][1]}">${stx[w.status][0]}</span></div>`).join('')}`:''}`);
    return;
  }
  apWdShot=null; apWdData=null;
  const av=apWdAvail();
  modal(`<h3>💰 ${esc(t('wd_t'))}</h3><p class="sub">${esc(t('avail'))}: <b class="mono" style="color:var(--blue)">${money(av)}</b></p>
   <div class="field"><label>${esc(t('wd_amt'))} — সর্বনিম্ন ${money(AP_WD.MIN_EARN)}</label><input id="apAmt" type="number" step="0.01" min="${AP_WD.MIN_EARN}" max="${av}"></div>
   <div class="field"><label>উত্তোলনের মাধ্যম</label><select id="apMethod"><option value="bank">🏦 ব্যাংক</option><option value="mobile">📱 মোবাইল ব্যাংকিং</option></select></div>
   <div id="apBankBox">
     <div class="field"><label>🏦 ব্যাংকের নাম *</label><input id="apBankName" placeholder="যেমন: Pubali Bank PLC"></div>
     <div class="field"><label>🏢 শাখার নাম *</label><input id="apBranch" placeholder="যেমন: Dhaka Main Branch"></div>
     <div class="field"><label>📍 শাখার ঠিকানা (স্পষ্টভাবে) *</label><textarea id="apBranchAddr" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;min-height:54px" placeholder="রোড, এলাকা, জেলা"></textarea></div>
     <div class="field"><label>💳 একাউন্ট নম্বর *</label><input id="apAccNo" inputmode="numeric" placeholder="শুধু সংখ্যা"></div>
     <div class="field"><label>👤 একাউন্ট হোল্ডারের নাম (ইংরেজিতে) *</label><input id="apAccName" placeholder="As per bank record" autocomplete="off"><p class="mono" style="font-size:10.5px;color:#B4530A;margin-top:4px">⚠️ ব্যাংক রেকর্ড অনুযায়ী হুবহু ইংরেজি নাম — ভুল হলে টাকা জব্দ হবে!</p></div>
   </div>
   <div id="apMobBox" style="display:none">
     <div class="field"><label>📱 সার্ভিসের নাম *</label><select id="apMbService"><option>bKash</option><option>Nagad</option><option>Rocket</option><option>Upay</option></select></div>
     <div class="field"><label>📞 মোবাইল নম্বর *</label><input id="apMbNo" inputmode="numeric" placeholder="01XXXXXXXXX"></div>
     <div class="field"><label> একাউন্টের ধরন *</label><select id="apMbType"><option value="Personal">পার্সোনাল</option><option value="Agent">এজেন্ট</option><option value="Merchant">মার্চেন্ট</option></select></div>
     <p class="mono" style="font-size:10.5px;color:#B4530A">⚠️ ধরনটা নিশ্চিত করে বাছো — পার্সোনাল/এজেন্ট/মার্চেন্ট ভুল হলে টাকা পৌঁছাবে না!</p>
   </div>
   <div class="field"><label>📎 ডকুমেন্ট স্ক্রিনশট (পাসবুক/স্টেটমেন্ট/একাউন্ট প্রমাণ) *</label>
     <button class="btn ghost sm" data-act="apWdShotPick" type="button">${ic('img')}স্ক্রিনশট দিন</button>
     <span id="apWdShotOk" class="mono" style="font-size:11px;color:var(--mut)"></span>
     <div id="apWdShotPrev" style="margin-top:8px"></div></div>
   ${myReqs.length?`<h5 class="panelab" style="margin:10px 0 4px">আমার আবেদনসমূহ</h5>${myReqs.map(w=>`<div class="rowline"><div class="tt"><div class="sn mono">${money(w.amt)} · ${esc(w.method)}</div><div class="mt">${new Date(w.ts).toLocaleDateString()}</div></div><span class="adstat ${stx[w.status][1]}">${stx[w.status][0]}</span>${w.status==='rejected'?`<a class="pact" href="mailto:${AP_WD.AUTH_EMAIL}?subject=${encodeURIComponent('Withdrawal Appeal — '+w.id)}" style="color:var(--blue)">📧 অনুমতি প্রার্থনা</a>`:''}</div>`).join('')}`:''}
   <button class="btn" style="width:100%;justify-content:center;margin-top:10px" data-act="apWdNext">${ic('send')}${esc(t('processing'))} → যাচাই</button>`);
  const ms=$('#apMethod'); if(ms) ms.onchange=()=>{ const b=ms.value; $('#apBankBox').style.display=b==='bank'?'block':'none'; $('#apMobBox').style.display=b==='mobile'?'block':'none'; };
}
function apWdShotPick(){
  const inp=$('#fin'); inp.accept='image/*';
  inp.onchange=()=>{ const f=inp.files[0]; if(!f)return; inp.value='';
    const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); const sc=Math.min(1,700/im.width); c.width=im.width*sc; c.height=im.height*sc; c.getContext('2d').drawImage(im,0,0,c.width,c.height); apWdShot=c.toDataURL('image/jpeg',0.8);
      const pv=$('#apWdShotPrev'); if(pv) pv.innerHTML='<img src="'+apWdShot+'" style="max-height:90px;border-radius:8px;border:1px solid var(--line)">';
      const ok=$('#apWdShotOk'); if(ok){ ok.textContent='✅ যুক্ত হয়েছে'; ok.style.color='#0B6E4F'; } };
    im.src=URL.createObjectURL(f); };
  inp.click();
}
function apWdNext(){
  const u=me(); if(!u) return openAuth('login');
  const av=apWdAvail();
  const amt=Math.round((parseFloat($('#apAmt').value)||0)*100)/100;
  const method=$('#apMethod').value;
  if(!(amt>=AP_WD.MIN_EARN)){ toast('সর্বনিম্ন '+money(AP_WD.MIN_EARN)+' লাগবে','alert'); return; }
  if(amt>av){ toast('সর্বোচ্চ উত্তোলনযোগ্য: '+money(av),'alert'); return; }
  let d={};
  if(method==='bank'){
    d={bank:$('#apBankName').value.trim(),branch:$('#apBranch').value.trim(),addr:$('#apBranchAddr').value.trim(),acc:$('#apAccNo').value.trim(),name:$('#apAccName').value.trim()};
    if(d.bank.length<3||d.branch.length<2||d.addr.length<5){ toast('ব্যাংক, শাখা ও ঠিকানা স্পষ্টভাবে লিখো','alert'); return; }
    if(!/^[0-9]{6,20}$/.test(d.acc.replace(/[\s-]/g,''))){ toast('একাউন্ট নম্বর সঠিক নয় (৬–২০ সংখ্যা)','alert'); return; }
    if(!/^[A-Za-z][A-Za-z .'\-]{2,49}$/.test(d.name)){ toast('হোল্ডারের নাম ইংরেজিতে সঠিকভাবে লিখো','alert'); return; }
  } else {
    d={service:$('#apMbService').value,no:$('#apMbNo').value.trim(),type:$('#apMbType').value};
    if(!/^(?:\+?880|0)1[3-9]\d{8}$/.test(d.no.replace(/[\s-]/g,''))){ toast('মোবাইল নম্বর সঠিক নয় (01XXXXXXXXX)','alert'); return; }
  }
  if(!apWdShot){ toast('ডকুমেন্ট স্ক্রিনশট বাধ্যতামূলক!','alert'); return; }
  apWdData={amt,method,d};
  const det=method==='bank' ? `🏦 ${esc(d.bank)} · শাখা: ${esc(d.branch)}<br>💳 ${esc(d.acc)} · 👤 ${esc(d.name)}` : `📱 ${esc(d.service)} · ${esc(d.no)} · ${esc(d.type)}`;
  modal(`<h3>🧾 চূড়ান্ত যাচাই</h3><p class="sub">সবকিছু মিলিয়ে নাও — এরপর ফিরতি সুযোগ নেই!</p>
   <div class="bankcard"><div class="money-row"><span>💰 পরিমাণ</span><b style="color:var(--blue);font-size:17px">${money(amt)}</b></div>${det}</div>
   ${apWdShot?`<img src="${apWdShot}" style="max-height:110px;border-radius:8px;border:1px solid var(--line);display:block;margin:8px 0">`:''}
   <div class="setrow" style="border:none"><span class="sl"><b style="font-size:13px">✅ আমি যাচাই করেছি — নাম, নম্বর, একাউন্ট হুবহু সঠিক</b></span><input type="checkbox" id="apCkA" style="width:20px;height:20px;accent-color:var(--blue)"></div>
   <div class="setrow" style="border:none"><span class="sl"><b style="font-size:13px;color:#C0195B">⚠️ জানি — ভুল তথ্যে টাকা কর্তৃপক্ষের একাউন্টে জমা হবে; ফেরতে ইমেইলে অনুমতি লাগবে</b></span><input type="checkbox" id="apCkB" style="width:20px;height:20px;accent-color:var(--blue)"></div>
   <button class="btn" style="width:100%;justify-content:center;margin-top:10px" data-act="apWdFinal">${ic('check')}আবেদন জমা দিন</button>
   <button class="btn ghost sm" style="width:100%;justify-content:center;margin-top:8px" data-act="apWdBack">← ফিরে যাও, ঠিক করি</button>`);
}
function apWdFinal(){
  if(!$('#apCkA').checked||!$('#apCkB').checked){ toast('দুটো স্বীকারোক্তিই টিক দাও','alert'); return; }
  const u=me();
  S.apWds.unshift({id:uid(),by:'me',name:u.name,ct:u.ct,amt:apWdData.amt,method:apWdData.method==='bank'?'🏦 ব্যাংক':'📱 মোবাইল ব্যাংকিং',d:apWdData.d,shot:apWdShot,ts:Date.now(),status:'pending'});
  apWdData=null; apWdShot=null; save(); closeModal();
  toast('✅ আবেদন জমা হয়েছে — কর্তৃপক্ষের অনুমোদনের অপেক্ষায়','send');
  renderView();
}

/* ---- কর্তৃপক্ষ প্যানেল (শুধু PIN-এর পরে) ---- */
function apWdAuthPanel(){
  if(!apAuthOk){ apAuthPanel(); return; }
  const pend=S.apWds.filter(w=>w.status==='pending');
  const appr=S.apWds.filter(w=>w.status==='approved');
  const rej=S.apWds.filter(w=>w.status==='rejected');
  const row=w=>`<div class="rowline" style="align-items:flex-start">
    ${w.shot?`<img src="${w.shot}" style="width:64px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--line);cursor:pointer" onclick="window.open(this.src)" >`:''}
    <div class="tt"><div class="sn">${esc(w.name)} (${esc(w.ct||'')}) — <b class="mono" style="color:var(--blue)">${money(w.amt)}</b></div>
    <div class="mt">${esc(w.method)}</div>
    <div class="mt">${w.method.indexOf('ব্যাংক')>=0?`🏦 ${esc(w.d.bank)} · শাখা: ${esc(w.d.branch)}<br>📍 ${esc(w.d.addr)}<br>💳 ${esc(w.d.acc)} · 👤 <b>${esc(w.d.name)}</b>`:`📱 ${esc(w.d.service)} · <b>${esc(w.d.no)}</b> · ${esc(w.d.type)}`}</div>
    <div class="mt mono">${new Date(w.ts).toLocaleString()} · ID: ${w.id}</div></div>
    <span style="display:flex;flex-direction:column;gap:6px">
     <button class="btn sm" data-act="apWdApprove" data-id="${w.id}">✅ অনুমোদন</button>
     <button class="btn ghost sm" style="color:#8A2A2A;border-color:#8A2A2A" data-act="apWdReject" data-id="${w.id}">❌ ভুল তথ্য</button></span></div>`;
  const mini=w=>`<div class="rowline"><div class="tt"><div class="sn">${esc(w.name)} — ${money(w.amt)} · ${esc(w.method)}</div><div class="mt mono">${new Date(w.ts).toLocaleDateString()} · ${w.id}</div></div><span class="adstat ${w.status==='approved'?'live':'rejected'}">${w.status==='approved'?'✅':'❌'}</span></div>`;
  modal(`<h3>💰 উত্তোলন অনুমোদন — কর্তৃপক্ষ</h3>
   <div class="bankcard" style="border-color:#C0195B"><div class="money-row"><span>🏛️ জব্দ-পুল (Autophagy PLC — ভুল-তথ্যের টাকা)</span><b style="color:#C0195B;font-size:18px">${money(S.apForfeit)}</b></div>
   <p class="mono" style="font-size:10.5px;color:var(--mut)">🔒 PIN-সুরক্ষিত — শুধু কর্তৃপক্ষ দেখছে। জব্দ টাকা সরাসরি অটোফজির একাউন্টে জমা হয়।</p></div>
   <h5 class="panelab" style="margin:12px 0 4px">⏳ অপেক্ষমাণ (${pend.length})</h5>
   ${pend.length?pend.map(row).join(''):'<p style="color:var(--mut);font-size:13.5px">কোনো অপেক্ষমাণ আবেদন নেই।</p>'}
   ${rej.length?`<h5 class="panelab" style="margin:12px 0 4px">❌ বাতিল/জব্দ (${rej.length})</h5>${rej.map(mini).join('')}`:''}
   ${appr.length?`<h5 class="panelab" style="margin:12px 0 4px">✅ অনুমোদিত (${appr.length})</h5>${appr.map(mini).join('')}`:''}`);
}

/* ---- পুরনো ফাংশন প্রতিস্থাপন (মূল কোড অক্ষত) ---- */
try{ window.__apOldWd=openWithdraw; openWithdraw=openApWithdraw; }catch(e){}
try{ const __apAP=apAuthPanel; apAuthPanel=function(){ __apAP();
  setTimeout(()=>{ try{ const c=$('#mcard'); if(!c||!apAuthOk) return;
    const n=S.apWds.filter(w=>w.status==='pending').length;
    c.insertAdjacentHTML('beforeend',`<button class="btn" style="width:100%;justify-content:center;margin-top:12px" data-act="apWdAuth">💰 উত্তোলন অনুমোদন${n?' ('+n+' অপেক্ষমাণ)':''}</button>`);
  }catch(e){} },60); }; }catch(e){}

/* ---- ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'apWdShotPick': apWdShotPick(); break;
    case 'apWdNext': apWdNext(); break;
    case 'apWdBack': openApWithdraw(); break;
    case 'apWdFinal': apWdFinal(); break;
    case 'apWdAuth': apWdAuthPanel(); break;
    case 'apWdApprove':
      { const w=S.apWds.find(x=>x.id===el.dataset.id); if(!w) break;
        w.status='approved';
        S.wds.unshift({acc:w.method.indexOf('ব্যাংক')>=0?w.d.acc:w.d.service+' '+w.d.no,holder:w.method.indexOf('ব্যাংক')>=0?w.d.name:w.name,amt:w.amt,shot:w.shot,ts:Date.now()});
        save(); toast('✅ অনুমোদিত — '+money(w.amt),'wallet'); apWdAuthPanel(); }
      break;
    case 'apWdReject':
      { const w=S.apWds.find(x=>x.id===el.dataset.id); if(!w) break;
        w.status='rejected'; S.apForfeit=(S.apForfeit||0)+(+w.amt||0); save();
        toast('❌ বাতিল — '+money(w.amt)+' জব্দ-পুলে জমা হলো','alert'); apWdAuthPanel(); }
      break;
  }}catch(err){ console.error(err); }
});

console.log('🔒 v2.8 ready — মনিটাইজেশন শর্ত · নিয়ন্ত্রিত উত্তোলন · কর্তৃপক্ষ অনুমোদন · জব্দ-পুল');
/* ═══════════ END v2.8 ═══════════ */
/* ═══════════ v2.9 — অ্যাড ✕/📢 · ইউনিভার্সাল ← · ⬆️⬇️ FAB ═══════════ */

/* ---- ১) অ্যাড বন্ধ (✕) + ফিরিয়ে আনা (📢) ---- */
function apSideShow(){ let r=document.getElementById('apReopen');
  if(!r){ r=document.createElement('button'); r.id='apReopen'; r.dataset.act='apSideOpen'; r.title='বিজ্ঞাপন আবার চালু'; r.textContent='📢 অ্যাড'; document.body.appendChild(r); }
  r.style.display='block'; }
function apSideHide(){ const r=document.getElementById('apReopen'); if(r) r.style.display='none'; }
(function(){ try{
  if(sessionStorage.getItem('apSideClosed')==='1'){ const d=document.getElementById('apSideAds'); if(d) d.style.display='none'; apSideShow(); }
  if(typeof apSideRender==='function'){ const o=apSideRender;
    apSideRender=function(){ o(); try{ const b=document.getElementById('apSideAds');
      if(b&&b.innerHTML&&!b.querySelector('.apSAX')){ const x=document.createElement('button');
        x.className='apSAX'; x.dataset.act='apSideX'; x.title='বিজ্ঞাপন বন্ধ করো'; x.textContent='✕'; b.appendChild(x); }
    }catch(e){} }; }
}catch(e){} })();

/* ---- ২) ভাসমান বাটন-ক্লাস্টার: ← · ⬆️ · ⬇️ ---- */
(function(){ try{
  const d=document.createElement('div'); d.id='apNavFab';
  d.innerHTML='<button id="apBackFab" data-act="apBackFab" title="ফিডে ফিরে যাও">←</button>'
   +'<button data-act="apGoTop" title="হেডারে যাও (উপরে)">⬆️</button>'
   +'<button data-act="apGoBot" title="ফুটারে যাও (নিচে)">⬇️</button>';
  document.body.appendChild(d);
}catch(e){} })();

/* ব্যাক বাটন দৃশ্যমানতা — ফিড ছাড়া সব ভিউতে দেখাবে */
try{ const __rv9=renderView; renderView=function(){ __rv9();
  try{ const f=document.getElementById('apBackFab'); if(f) f.style.display=(view&&view!=='feed')?'grid':'none'; }catch(e){} }; }catch(e){}

/* ---- ৩) ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'apSideX':
      { const d=document.getElementById('apSideAds'); if(d) d.style.display='none';
        const m=document.getElementById('apSideAdsM'); if(m) m.style.display='none';
        sessionStorage.setItem('apSideClosed','1'); apSideShow();
        toast('📢 বিজ্ঞাপন বন্ধ — ডান পাশের 📢 ট্যাবে চেপে আবার চালু করো','check'); }
      break;
    case 'apSideOpen':
      { sessionStorage.removeItem('apSideClosed');
        const d=document.getElementById('apSideAds'); if(d) d.style.display='';
        const m=document.getElementById('apSideAdsM'); if(m) m.style.display='';
        apSideHide(); toast('📢 বিজ্ঞাপন আবার চালু','check'); }
      break;
    case 'apBackFab': go('feed'); break;
    case 'apGoTop': window.scrollTo({top:0,behavior:'smooth'}); break;
    case 'apGoBot': window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}); break;
  }}catch(err){ console.error(err); }
});

try{ const f=document.getElementById('apBackFab'); if(f) f.style.display=(view&&view!=='feed')?'grid':'none'; }catch(e){}
console.log('✨ v2.9 ready — অ্যাড ✕/📢 · ইউনিভার্সাল ← · ⬆️⬇️ হেডার-ফুটার জাম্প');
/* ═══════════ END v2.9 ═══════════ */

/* ═══════════ v3.0 — ইউনিভার্সাল ব্যাক বাটন (সব ফিচারে) ═══════════ */
/* ফিড ছাড়া সব পেজে লাল ← দেখাবে; চাপলে সোজা ফিডে ফেরা */
(function(){ try{
  /* ভিউ বদলালেই বাটন আপডেট — সব ক্ষেত্রে ধরার জন্য হালকা মনিটর */
  setInterval(()=>{ try{
    const f=document.getElementById('apBackFab'); if(!f) return;
    f.classList.toggle('apOn', !!(view && view!=='feed'));
  }catch(e){} },400);
  /* এখনই একবার চেক */
  const f=document.getElementById('apBackFab');
  if(f) f.classList.toggle('apOn', !!(view && view!=='feed'));
}catch(e){} })();
console.log('✨ v3.0 — ব্যাক বাটন সব পেজে চালু (লাল ←)');
/* ═══════════ END v3.0 ═══════════ */

/* ═══════════ v3.1 — 🔴 লাইভ ভিডিও · পলিসি-সতর্কতা · অটো-বাতিল · কর্তৃপক্ষ মডারেশন ═══════════ */
S.lives=S.lives||[];
let apLive=null, apLiveTimer=null, apViewTimer=null;
const AP_LIVE_BAD=(typeof BAD_RE!=='undefined')?BAD_RE:/ sexual|porn|nude|xxx|রক্ত|হত্যা|যৌন|অশ্লীল|গালি|murder|gore|blood.*fight/i;

/* ---- রেইলে 🔴 লাইভ বাটন ---- */
(function(){ try{ const rail=$('#rail'); if(!rail) return;
  if(rail.querySelector('[data-act="openLiveHome"]')) return;
  const b=document.createElement('button'); b.className='rl'; b.dataset.act='openLiveHome';
  b.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"></circle></svg><span>লাইভ এখন</span>';
  const sp=rail.querySelector('.rl-sp'); if(sp) rail.insertBefore(b,sp); else rail.appendChild(b);
}catch(e){} })();

/* ---- লাইভ হোম ---- */
function renderLiveHome(){
  view='liveHome';
  const act=S.lives.filter(l=>l.status==='live');
  $('#view').innerHTML=`<button class="backb" data-act="backFeed">${ic('back','width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="surge-h" style="margin-top:4px"><h2>🔴 লাইভ এখন</h2><p>যেকোনো জায়গা থেকে, যেকোনো বিষয়ে — মুখে মুখে। কিন্তু নীতি ভাঙলে লাইভ সাথে সাথেই বাতিল।</p></div>
  <div class="live-hero">
   <button class="btn" style="width:100%;justify-content:center;margin-bottom:18px" data-act="livePolicy">🔴 লাইভে যাও (শুরু করো)</button>
   <h5 class="panelab" style="margin-bottom:10px">এখন লাইভ (${act.length})</h5>
   ${act.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px">${act.map(l=>`
     <button class="live-card" data-act="liveWatch" data-id="${l.id}">
      <span class="lcx"><span class="live-badge"><span class="live-dot"></span>LIVE</span></span>
      <span class="lct"><b>${esc(l.title)}</b><br><span class="mono" style="font-size:11px;color:var(--mut)">👤 ${esc(l.host)} · 👁 ${fmt(l.viewers)} · 💬 ${l.chat.length}</span></span>
     </button>`).join('')}</div>`:`<p style="color:var(--mut);padding:16px 0">এখন কোনো লাইভ নেই — তুমিই প্রথম হও! 🔴</p>`}
   <div class="policy-warn" style="margin-top:18px">📜 <b>লাইভ নীতি:</b> যৌনতা · সহিংসতা · মারামারি · রক্তাক্ত দৃশ্য · অশালীন বক্তব্য — কোনোটাই চলবে না। ভাঙলে <b>লাইভ তাৎক্ষণিক বাতিল</b> + অ্যাকাউন্টে স্ট্রাইক।</div>
  </div>`;
  renderHeader(); toggleMenu(false); try{apMarkRail('openLiveHome');}catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ---- ধাপ ১: পলিসি সতর্কবার্তা (লাইভের আগেই বাধ্যতামূলক) ---- */
function openLivePolicy(){
  if(!me()) return openAuth('login');
  modal(`<h3>🔴 লাইভ শুরুর আগে — গুরুত্বপূর্ণ বার্তা</h3>
   <div class="policy-warn"><b>⚠️ পড়ো, মনোযোগ দিয়ে:</b><br>
   তুমি যে যায়গা থেকে, যে বিষয় নিয়েই লাইভে আসো — নিচের কোনো কিছুই করতে পারবে না:<br><br>
   🚫 যৌনতা বা অশ্লীল আচরণ/পোশাক<br>
   🚫 সহিংসতা, মারামারি, রক্তাক্ত দৃশ্য<br>
   🚫 অশালীন বক্তব্য, গালিগালাজ, ঘৃণা-বাক্<br>
   🚫 ভুয়া তথ্য, স্প্যাম, প্রতারণা<br><br>
   <b>ভাঙলে:</b> তোমার লাইভ <b>সাথে সাথেই বাতিল</b> হবে — দর্শক রিপোর্ট বা স্বয়ংক্রিয় ফিল্টারে। সাথে অ্যাকাউন্টে স্ট্রাইক ও নীতি-নোটিশ যাবে।</div>
   <div class="setrow" style="border:none"><span class="sl"><b style="font-size:13.5px">আমি সব নিয়ম পড়েছি ও বুঝেছি</b></span><input type="checkbox" id="lvCkA" style="width:20px;height:20px;accent-color:var(--blue)"></div>
   <div class="setrow" style="border:none"><span class="sl"><b style="font-size:13.5px">নিয়ম ভাঙলে লাইভ বাতিল + স্ট্রাইক — তা মেনেছি</b></span><input type="checkbox" id="lvCkB" style="width:20px;height:20px;accent-color:var(--blue)"></div>
   <button class="btn" style="width:100%;justify-content:center" data-act="liveSetupGo">✅ মেনেছি — লাইভ সেটআপ করি</button>`);
}

/* ---- ধাপ ২: সেটআপ ---- */
function openLiveSetup(){
  if(!$('#lvCkA').checked||!$('#lvCkB').checked){ toast('দুটো স্বীকারোক্তিই টিক দাও','alert'); return; }
  modal(`<h3>🎬 লাইভ সেটআপ</h3>
   <div class="field"><label>লাইভের শিরোনাম *</label><input id="lvTitle" maxlength="90" placeholder="যেমন: ঢাকার বৃষ্টির সন্ধ্যা থেকে…"></div>
   <div class="field"><label>বিষয়</label><select id="lvTopic">${TOPIC_KEYS.map(k=>`<option value="${k}">${esc(tl(k))}</option>`).join('')}</select></div>
   <p class="mono" style="font-size:10.5px;color:var(--mut);margin-bottom:10px">📷 পরের ধাপে ক্যামেরা-মাইকের অনুমতি চাইবে — Allow দিও।</p>
   <button class="btn" style="width:100%;justify-content:center" data-act="liveStart">${ic('vid')}🔴 লাইভ শুরু করো</button>`);
}

/* ---- ধাপ ৩: লাইভ শুরু ---- */
async function startLive(){
  const title=($('#lvTitle').value||'').trim();
  if(title.length<3){ toast('শিরোনাম লেখো (৩+ অক্ষর)','alert'); return; }
  if(AP_LIVE_BAD.test(title)){ liveTerminate('শিরোনামে নিষিদ্ধ বিষয়'); return; }
  const u=me();
  let stream=null;
  try{ stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true}); }
  catch(e){ toast('📷 ক্যামেরা/মাইকের অনুমতি দাও — তারপর আবার চেষ্টা করো','alert'); return; }
  apLive={id:uid(),host:u.name,by:'me',title,topic:$('#lvTopic').value,stream,ts:Date.now(),viewers:1+Math.floor(Math.random()*8),reports:0,chat:[],status:'live'};
  S.lives.unshift(apLive); save();
  toast('🔴 আপনি এখন লাইভে!','send');
  renderLiveRoom();
  /* দর্শক + চ্যাট প্রাণবন্ত রাখা */
  apViewTimer=setInterval(()=>{ if(!apLive) return;
    apLive.viewers=Math.max(1,apLive.viewers+(Math.random()<.5?1:-1)*Math.ceil(Math.random()*2));
    if(Math.random()<.45){ const g=['রাকিব','Nadia','Lin','Omar','Amara','Fahim','Yuki','Sara'];
      const lines=['🔥 দারুণ চলছে!','সব কথা খুলে বলো!','বাংলাদেশ থেকে দেখছি ❤️','Nice!','শুনছি…','আরেকটু গল্প বলো!','🇧🇩🇧🇩'];
      apLive.chat.push({n:g[Math.floor(Math.random()*g.length)],t:lines[Math.floor(Math.random()*lines.length)],sys:false});
      const lg=$('#lvChatLog'); if(lg){ lg.insertAdjacentHTML('beforeend','<div class="bub you"><b>'+g[Math.floor(Math.random()*g.length)]+'</b><span>'+esc(apLive.chat[apLive.chat.length-1].t)+'</span></div>'); lg.scrollTop=1e6; } }
    const v=$('#lvViews'); if(v) v.textContent='👁 '+fmt(apLive.viewers);
    save();
  },6000);
}
window.addEventListener('beforeunload',()=>{ try{ if(apLive) endLive(true); }catch(e){} });

/* ---- লাইভ রুম ---- */
function renderLiveRoom(){
  const L=apLive; if(!L) return renderLiveHome();
  const isHost=L.by==='me';
  view='liveRoom';
  $('#view').innerHTML=`<button class="backb" data-act="backFeed">${ic('back','width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="live-hero"><div class="live-grid">
   <div class="live-player">
    <span class="lv-top"><span class="live-badge"><span class="live-dot"></span>LIVE</span><span class="stamp">${esc(tl(L.topic))}</span><span class="lv-views" id="lvViews">👁 ${fmt(L.viewers)}</span></span>
    <video id="lvVid" autoplay muted playsinline></video>
    <div class="lv-cap"><b>${esc(L.title)}</b> · 👤 ${esc(L.host)}</div>
    ${isHost?'<button class="lv-end" data-act="liveEnd">⏹ লাইভ শেষ করো</button>':''}
   </div>
   <div class="live-chat">
    <div class="lc-h">💬 লাইভ চ্যাট</div>
    <div class="lc-log" id="lvChatLog">${L.chat.map(c=>`<div class="bub you"><b>${esc(c.n)}</b><span>${esc(c.t)}</span></div>`).join('')}</div>
    <div class="lc-form"><input id="lvChatIn" maxlength="140" placeholder="মেসেজ লেখো…" autocomplete="off"><button class="c-send" data-act="liveChatSend">${ic('send','width:15px;height:15px')}</button></div>
   </div></div>
   ${isHost?`<div class="lv-rep">🛡️ মনে রাখো — নীতিভঙ্গ ধরা পড়লেই লাইভ অটো-বাতিল। দর্শকের রিপোর্ট: <b id="lvRepN">${L.reports}</b>/৩</div>`
   :`<div class="lv-rep">🚨 এই লাইভে যৌনতা/সহিংসতা/অশালীনতা দেখছো? <button class="btn ghost sm" style="border-color:#B4472E;color:#B4472E" data-act="liveReport">🚩 রিপোর্ট করো (${L.reports}/৩)</button><span>৩টা রিপোর্টেই লাইভ অটো-বাতিল!</span></div>`}
  </div>`;
  const v=$('#lvVid'); if(v&&L.stream){ try{ v.srcObject=L.stream; }catch(e){} }
  renderHeader(); toggleMenu(false);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ---- চ্যাট + অটো-মডারেশন ---- */
function liveChatSend(){
  const L=apLive; if(!L) return;
  const inp=$('#lvChatIn'); const v=(inp.value||'').trim(); if(!v) return; inp.value='';
  if(AP_LIVE_BAD.test(v)){ liveTerminate('চ্যাটে নিষিদ্ধ বক্তব্য'); return; }
  L.chat.push({n:me()?me().name:'তুমি',t:v,sys:false});
  const lg=$('#lvChatLog'); if(lg){ lg.insertAdjacentHTML('beforeend',`<div class="bub me"><b>${esc(me()?me().name:'তুমি')}</b><span>${esc(v)}</span></div>`); lg.scrollTop=1e6; }
  save();
}

/* ---- রিপোর্ট → ৩ হলে অটো-বাতিল ---- */
function liveReport(){
  const L=apLive; if(!L) return;
  L.reports++;
  toast('🚩 রিপোর্ট জমা হলো ('+L.reports+'/৩)','alert');
  if(L.reports>=3){ liveTerminate('৩টি দর্শক-রিপোর্ট — নীতিলঙ্ঘন সন্দেহে'); return; }
  renderLiveRoom();
}

/* ---- বাতিল/শেষ ---- */
function liveTerminate(reason){
  const L=apLive||S.lives.find(x=>x.status==='live');
  if(L){ L.status='terminated'; L.reason=reason; save(); }
  cleanupLive();
  modal(`<h3>⛔ লাইভ বাতিল হয়েছে</h3>
   <div class="notice">🚫 <b>কারণ:</b> ${esc(reason)}।<br>অটোফজির নীতি অনুযায়ী যৌনতা, সহিংসতা, মারামারি, রক্তাক্ত দৃশ্য ও অশালীন বক্তব্য কঠোরভাবে নিষিদ্ধ। এই লঙ্ঘনের জন্য অ্যাকাউন্টে স্ট্রাইক দেওয়া হলো ও নীতি-নোটিশ ইমেইলে গেল।</div>
   <button class="btn" style="width:100%;justify-content:center" data-act="closeModal">বুঝেছি</button>`);
  addNotif('⛔ লাইভ বাতিল — '+reason,'alert');
  renderLiveHome();
}
function endLive(silent){
  const L=apLive; if(!L) return;
  L.status='ended'; L.dur=Math.floor((Date.now()-L.ts)/1000); save();
  cleanupLive();
  if(!silent) toast('⏹ লাইভ শেষ — সময়: '+Math.floor(L.dur/60)+':'+String(L.dur%60).padStart(2,'0'),'vid');
  renderLiveHome();
}
function cleanupLive(){
  if(apViewTimer){ clearInterval(apViewTimer); apViewTimer=null; }
  if(apLive&&apLive.stream){ try{ apLive.stream.getTracks().forEach(x=>x.stop()); }catch(e){} }
  apLive=null;
}
try{ const __cmL=closeModal; closeModal=function(){ try{ if(apLive&&view==='liveRoom'){ endLive(true); } }catch(e){} __cmL(); }; }catch(e){}

/* ---- দর্শক মোড (ডেমো কার্ড থেকে) ---- */
function liveWatch(id){
  const L=S.lives.find(x=>x.id===id); if(!L||L.status!=='live'){ toast('এই লাইভটা আর চালু নেই','alert'); renderLiveHome(); return; }
  apLive=Object.assign({},L,{stream:null});
  renderLiveRoom();
  const v=$('#lvVid'); if(v) v.outerHTML='<div class="lv-off">🔴 <br>'+esc(L.host)+' লাইভে আছেন…<br><span style="font-size:13px;color:rgba(255,255,255,.7)">দর্শক-স্ট্রিম সব ডিভাইসে আসবে Firebase যুক্ত হলে — চ্যাট এখনই খোলা!</span></div>';
}

/* ---- কর্তৃপক্ষ মডারেশন (PIN-এর পরে) ---- */
try{ const __ap2=apAuthPanel; apAuthPanel=function(){ __ap2();
  setTimeout(()=>{ try{ const c=$('#mcard'); if(!c||!apAuthOk) return;
    const n=S.lives.filter(l=>l.status==='live').length;
    c.insertAdjacentHTML('beforeend',`<button class="btn" style="width:100%;justify-content:center;margin-top:10px" data-act="apLiveMod">🔴 লাইভ মডারেশন${n?' ('+n+' চলছে)':''}</button>`);
  }catch(e){} },60); }; }catch(e){}
function apLiveModPanel(){
  const act=S.lives.filter(l=>l.status==='live');
  modal(`<h3>🔴 লাইভ মডারেশন — কর্তৃপক্ষ</h3>
   ${act.length?act.map(l=>`<div class="rowline"><div class="tt"><div class="sn">🔴 ${esc(l.title)}</div><div class="mt">👤 ${esc(l.host)} · 👁 ${fmt(l.viewers)} · 🚩 ${l.reports}/৩ · ${new Date(l.ts).toLocaleTimeString()}</div></div>
   <button class="btn sm" style="background:#FF3B30" data-act="apLiveKill" data-id="${l.id}">⛔ বাতিল করো</button></div>`).join(''):'<p style="color:var(--mut)">এখন কোনো লাইভ চলছে না।</p>'}
   <h5 class="panelab" style="margin:14px 0 4px">ইতিহাস</h5>
   ${S.lives.filter(l=>l.status!=='live').slice(0,8).map(l=>`<div class="rowline"><div class="tt"><div class="sn">${esc(l.title)}</div><div class="mt">${l.status==='terminated'?'⛔ বাতিল — '+esc(l.reason||''):'✅ সম্পন্ন'}</div></div><span class="adstat ${l.status==='terminated'?'rejected':'live'}">${l.status==='terminated'?'বাতিল':'শেষ'}</span></div>`).join('')||'<p style="color:var(--mut);font-size:13px">এখনো কোনো লাইভ হয়নি।</p>'}`);
}

/* ---- ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'openLiveHome': renderLiveHome(); break;
    case 'livePolicy': openLivePolicy(); break;
    case 'liveSetupGo': openLiveSetup(); break;
    case 'liveStart': startLive(); break;
    case 'liveEnd': endLive(); break;
    case 'liveChatSend': liveChatSend(); break;
    case 'liveReport': liveReport(); break;
    case 'liveWatch': liveWatch(el.dataset.id); break;
    case 'apLiveMod': apLiveModPanel(); break;
    case 'apLiveKill':
      { const L=S.lives.find(x=>x.id===el.dataset.id); if(!L) break;
        const wasMe=apLive&&apLive.id===L.id;
        L.status='terminated'; L.reason='কর্তৃপক্ষের নির্দেশে বাতিল'; save();
        if(wasMe) cleanupLive();
        addNotif('⛔ আপনার লাইভ কর্তৃপক্ষ বাতিল করেছে — নীতিলঙ্ঘন','alert');
        toast('⛔ লাইভ বাতিল হয়েছে','alert'); apLiveModPanel(); }
      break;
  }}catch(err){ console.error(err); }
});

/* চ্যাট এন্টার-কী */
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target&&e.target.id==='lvChatIn'){ e.preventDefault(); liveChatSend(); } });

console.log('🔴 v3.1 ready — লাইভ ভিডিও · পলিসি-সতর্কতা · ৩-রিপোর্ট অটো-বাতিল · কর্তৃপক্ষ মডারেশন');
/* ═══════════ END v3.1 ═══════════ */

/* ═══════════ v3.2 — ডেমো-সততা মোড (আসল আয় চালু হলে DEMO_MODE=false করলেই সব মিলিয়ে যাবে) ═══════════ */
const AP_DEMO_MODE=true; /* 🔑 লাইভ ইউজার + আসল আয় চালু করার দিন শুধু true → false করবে! */

if(AP_DEMO_MODE){
  /* ---- ১) ভাসমান DEMO ব্যাজ (ক্লিকে ব্যাখ্যা) ---- */
  (function(){ try{
    const b=document.createElement('button'); b.id='apDemoBadge';
    b.innerHTML='🧪 DEMO VERSION';
    b.onclick=()=>{ modal('<h3>🧪 এটি ডেমো ভার্সন</h3><p class="sub">Autophagy — প্রাক-প্রদর্শনী (Beta Preview)</p>'
      +'<div class="policy-warn" style="border-color:#B4530A;color:#7A4A1B;background:#FBF5ED"><b>টেস্টের জন্য যা যা নাটকীয়:</b><br>'
      +'📊 পাঠ (reads) সংখ্যা — স্বয়ংক্রিয় ডেমো<br>'
      +'💰 আয়ের ডলার — দেখানো মাত্র, বাস্তব নয়<br>'
      +'📺 অ্যাড রেভিনিউ টিকার — ডেমো<br><br>'
      +'<b>আসল যা কাজ করছে:</b> পোস্ট, লাইক, কমেন্ট, চ্যাট, গ্রুপ, রিলস, লাইভ, গেমস — সব!<br><br>'
      +'<b>ভবিষ্যৎ:</b> লাইভ লঞ্চের পর আসল আয় (Google AdSense + বিজ্ঞাপনদাতা) চালু হবে — তখন এই ব্যাজ সরে যাবে।</div>'
      +'<button class="btn" style="width:100%;justify-content:center" data-act="closeModal">বুঝেছি</button>'); };
    document.body.appendChild(b);
  }catch(e){} })();

  /* ---- ২) ডলার-সংখ্যার পাশে "ডেমো" ট্যাগ বসানোর স্ক্যানার ---- */
  setInterval(()=>{ try{
    /* ইনসাইট প্যানেলের টাকা + আয়-ট্যাবের bignum + আর্ন জোনের বড় সংখ্যা */
    document.querySelectorAll('.money-row b, .ins .money-row b, .pane .bignum, .azcard .bignum').forEach(el=>{
      if(el.dataset.apDemo==='1'||el.dataset.apDemo==='2') return;
      const txt=el.textContent||'';
      if(/^\$[\d,.]+$/.test(txt.trim())||txt.trim().indexOf('$')===0){
        el.dataset.apDemo='1';
        if(!el.querySelector('.apDemoTag')) el.insertAdjacentHTML('beforeend',' <span class="apDemoTag">🧪 demo</span>');
      }
    });
  }catch(e){} },2000);

  /* ---- ৩) উত্তোলন ফর্মের উপরে সতর্ক-ব্যানার ---- */
  try{ const __wd=openApWithdraw; openApWithdraw=function(){ __wd();
    setTimeout(()=>{ try{ const c=$('#mcard'); if(!c) return;
      c.insertAdjacentHTML('afterbegin','<div class="policy-warn" style="margin:0 0 12px">🧪 <b>ডেমো মোড:</b> এই উত্তোলন ব্যবস্থা এখন পরীক্ষামূলক। আসল টাকা এখনো লেনদেন হয় না — লাইভ লঞ্চের পর আসল পেমেন্ট চালু হবে।</div>');
    }catch(e){} },80); }; }catch(e){}
  try{ const __wd2=openWithdraw; if(openWithdraw===__wd2||typeof __wd2==='function'){ openWithdraw=function(){ __wd2();
    setTimeout(()=>{ try{ const c=$('#mcard'); if(!c||c.querySelector('.policy-warn')) return;
      c.insertAdjacentHTML('afterbegin','<div class="policy-warn" style="margin:0 0 12px">🧪 <b>ডেমো মোড:</b> এই উত্তোলন ব্যবস্থা এখন পরীক্ষামূলক — আসল টাকা এখনো লেনদেন হয় না।</div>');
    }catch(e){} },80); }; } }catch(e){}

  console.log('🧪 v3.2 — ডেমো-সততা মোড চালু (আসল আয়ের দিন AP_DEMO_MODE=false করো)');
}else{
  console.log('✅ v3.2 — আসল মোড (ডেমো ব্যাজ বন্ধ)');
}
/* ═══════════ END v3.2 ═══════════ */

/* ═══════════ v3.3 — মোবাইল ☰ ড্রয়ার · হেডারে 🔴 লাইভ · ফেভিকন ফিক্স ═══════════ */
const AP_LIVE_SVG='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill="#FF3B30" stroke="none"/></svg>';

/* ---- ১) হেডারে 🔴 লাইভ + ☰ মেনু বাটন ---- */
(function(){ try{
  const tb=document.querySelector('#topbar .tb-in'); if(!tb) return;
  if(!document.getElementById('apLiveTop')){
    const l=document.createElement('button');
    l.id='apLiveTop'; l.className='tbtn'; l.dataset.act='openLiveHome'; l.title='লাইভ এখন';
    l.innerHTML=AP_LIVE_SVG+'<span>লাইভ</span><span class="lv-dot"></span>';
    const az=document.getElementById('authZone');
    if(az) tb.insertBefore(l,az); else tb.appendChild(l);
  }
  if(!document.getElementById('apMenuBtn')){
    const b=document.createElement('button');
    b.id='apMenuBtn'; b.className='tbtn'; b.dataset.act='apDrawerToggle'; b.setAttribute('aria-label','মেনু');
    b.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    const az=document.getElementById('authZone');
    if(az) tb.insertBefore(b,az); else tb.appendChild(b);
  }
}catch(e){} })();

/* ---- ২) মোবাইল ড্রয়ার — সব ফিচার এক জায়গায় ---- */
function apDrawerOpen(){
  const old=document.getElementById('apDrawer'); if(old) old.remove();
  const u=me();
  const it=(act,attrs,icn,txt,live)=>`<button class="apd-item ${live?'apd-live':''}" data-act="${act}" ${attrs}>${icn}<span>${esc(txt)}</span></button>`;
  const d=document.createElement('div'); d.id='apDrawer'; d.className='open';
  d.innerHTML=`<div class="apd-ovl" data-act="apDrawerClose"></div>
  <div class="apd-panel">
   <div class="apd-h"><b>Autophagy<em style="font-style:normal;color:var(--blue)">.</em></b><button class="mclose" data-act="apDrawerClose">${ic('x')}</button></div>
   ${it('rail','data-i="0"',ic('feather'),'সব বিষয়')}
   ${u?it('rail','data-i="1"',ic('user'),t('m_profile')):''}
   ${it('rail','data-i="2"',ic('bookmark'),t('t_saved'))}
   <div class="apd-sep"></div>
   ${it('openLiveHome','',AP_LIVE_SVG,'🔴 লাইভ এখন',true)}
   ${it('openReels','',ic('reels'),'🎬 '+t('reels'))}
   ${it('openGames','',ic('game'),'🎮 '+t('games'))}
   <div class="apd-sep"></div>
   ${it('rail','data-i="4"',ic('cmt'),t('m_msgs'))}
   ${it('rail','data-i="3"',ic('wallet'),t('az_t'))}
   ${it('rail','data-i="5"',ic('wallet'),t('t_earnings'))}
   ${it('rail','data-i="6"',ic('shield'),t('t_security'))}
   ${it('openPrivacy','',ic('lock'),'🔐 '+t('privacy_t'))}
   ${it('openAds','',ic('zap'),'📢 '+t('advertise'))}
   <div class="apd-sep"></div>
   ${u?it('m_logout','',ic('out'),t('m_logout')):it('m_login','',ic('user'),t('m_login'))}
  </div>`;
  document.body.appendChild(d);
}

/* ---- ৩) ড্রয়ার ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  const act=el.dataset.act;
  if(act==='apDrawerToggle'){ apDrawerOpen(); return; }
  if(act==='apDrawerClose'){ const d=document.getElementById('apDrawer'); if(d) d.remove(); return; }
  if(el.closest('#apDrawer')){ setTimeout(()=>{ const x=document.getElementById('apDrawer'); if(x) x.remove(); },180); }
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const d=document.getElementById('apDrawer'); if(d) d.remove(); } });

/* ---- ৪) ফেভিকন চূড়ান্ত ফিক্স (সঠিক ফাইলনাম) ---- */
(function(){ try{
  document.querySelectorAll('link[rel="icon"]').forEach(x=>x.remove());
  const l=document.createElement('link'); l.rel='icon'; l.type='image/png';
  l.href='images/logo2.png.png?v=6'; document.head.appendChild(l);
}catch(e){} })();

console.log('✨ v3.3 ready — মোবাইল ☰ ড্রয়ার · হেডারে 🔴 লাইভ · ফেভিকন ফিক্স');
/* ═══════════ END v3.3 ═══════════ */

/* ═══════════ v3.4 — গ্লোবাল লেয়ার · কমেন্ট · ফলো · চ্যাট (Firebase কী বসালেই অটো-লাইভ) ═══════════ */
const apCmtStore={}, apPushed=new Set();
let apFBReady=false, apGChatUnsub=null, apGChatMsgs=[], apLastGSend=0, apFollowMirror=null, apSyncT=null, apRrT=null;

/* ---- সিড: পুরনো লোকাল কমেন্ট আর পাঠানো হবে না ---- */
(function(){ try{ const w=post=>{ (post.comments||[]).forEach(c=>{ apPushed.add(c.id); (c.replies||[]).forEach(r=>apPushed.add(r.id)); }); };
  (S.posts||[]).forEach(w); (S.remote||[]).forEach(w);
}catch(e){} })();

/* ---- দূরের লেখকের নাম সঠিকভাবে দেখানোর ব্যবস্থা ---- */
function apEnsurePerson(name,ct){ try{
  if(!name) name='Writer';
  const id='r_'+Math.abs(hashStr('u:'+name)).toString(36);
  let p=null; try{ p=person(id); }catch(e){}
  if(!p){ const np={id,name,ct:ct||'',bio:'🌍 গ্লোবাল লেখক',fl:0,lines:[]};
    try{ PEOPLE.push(np); }catch(e){ return null; } return np; }
  return p;
}catch(e){ return null; } }

/* ---- রিমোট কমেন্ট মার্জ (ডুপ্লিকেট ছাড়া) ---- */
function apApplyComments(){ try{
  Object.keys(apCmtStore).forEach(pid=>{
    const post=(S.posts||[]).find(x=>x.id===pid)||(S.remote||[]).find(x=>x.id===pid);
    if(!post) return;
    post.comments=post.comments||[];
    apCmtStore[pid].forEach(c=>{
      if(c.pid){ const par=post.comments.find(x=>x.id===c.pid);
        if(par){ par.replies=par.replies||[];
          if(!par.replies.some(r=>r.id===c.id)){ const pp=apEnsurePerson(c.n,c.ct);
            par.replies.push({id:c.id,by:pp?pp.id:'r_x',anon:!!c.a,text:c.t,ts:c.ts||0}); } }
        return; }
      if(!post.comments.some(x=>x.id===c.id)){ const pp=apEnsurePerson(c.n,c.ct);
        post.comments.push({id:c.id,by:pp?pp.id:'r_x',anon:!!c.a,text:c.t,ts:c.ts||0}); }
    });
  });
}catch(e){} }

/* ---- নতুন কমেন্ট/রিপ্লাই/ফলো Firebase-এ পাঠানো (save()-এর সাথে অটো) ---- */
function apQueueSync(){ if(apSyncT) return; apSyncT=setTimeout(()=>{ apSyncT=null; try{apSyncOut();}catch(e){} },1200); }
function apSyncOut(){
  if(!apFBReady||!me()||typeof firebase==='undefined') return;
  let n=0; const FV=firebase.firestore.FieldValue;
  const walk=post=>{ if(!post||n>=25) return;
    (post.comments||[]).forEach(c=>{
      if(!apPushed.has(c.id)&&n<25){ apPushed.add(c.id);
        const u=(c.by==='me')?me():null; const pp=(u?null:person(c.by))||{};
        try{ FBDB.collection('acmts').doc(c.id).set({p:post.id,pid:'',id:c.id,
          n:c.anon?'Anonymous':(u?u.name:(pp.name||'Writer')),a:!!c.anon,t:c.text,
          ts:c.ts||Date.now(),ct:u?u.ct:(pp.ct||'')}); n++; }catch(e){} }
      (c.replies||[]).forEach(r=>{
        if(!apPushed.has(r.id)&&n<25){ apPushed.add(r.id);
          const u=(r.by==='me')?me():null; const pp=(u?null:person(r.by))||{};
          try{ FBDB.collection('acmts').doc(r.id).set({p:post.id,pid:c.id,id:r.id,
            n:r.anon?'Anonymous':(u?u.name:(pp.name||'Writer')),a:!!r.anon,t:r.text,
            ts:r.ts||Date.now(),ct:u?u.ct:(pp.ct||'')}); n++; }catch(e){} }
      });
    });
  };
  (S.posts||[]).forEach(walk); (S.remote||[]).forEach(walk);
  const cur=(S.follows||[]).slice();
  if(apFollowMirror===null){ apFollowMirror=cur; return; }
  cur.forEach(id=>{ if(!apFollowMirror.includes(id)){ try{ FBDB.collection('afollows').doc(id).set({n:FV.increment(1)},{merge:true}); }catch(e){} } });
  apFollowMirror.forEach(id=>{ if(!cur.includes(id)){ try{ FBDB.collection('afollows').doc(id).set({n:FV.increment(-1)},{merge:true}); }catch(e){} } });
  apFollowMirror=cur;
}
try{ const o=save; save=function(){ try{o();}catch(e){} apQueueSync(); }; }catch(e){}

/* ---- র‍্যাপার: ফিডে মার্জ ধরা · প্রোফাইলে 🌍 কাউন্ট · পোস্ট একই ID-তে ---- */
try{ const o=renderFeed; renderFeed=function(){ try{apApplyComments();}catch(e){} return o(); }; }catch(e){}
try{ const o=renderView; renderView=function(){ if(view==='gchat'){ renderGChat(); try{renderHeader();}catch(e){} return; } return o(); }; }catch(e){}
try{ const o=renderPersonProfile; renderPersonProfile=function(id){ const r=o(id);
  try{ if(apFBReady){ const f=document.querySelector('.p-fstats');
    if(f&&!f.querySelector('#apGF')){ f.insertAdjacentHTML('beforeend','<span style="color:var(--blue)">🌍 <b id="apGF">…</b></span>');
      FBDB.collection('afollows').doc(id).get().then(d=>{ const el=document.getElementById('apGF'); if(el) el.textContent=fmt(((d.data()||{}).n)||0); }).catch(()=>{}); } } }catch(e){}
  return r; }; }catch(e){}
try{ const o=pushRemote; pushRemote=async function(p){ if(!FBDB) return;
  try{ const media=(p.media||[]).filter(m=>m.type==='image'&&m.url&&m.url.length<600000).map(m=>({type:'image',url:m.url}));
    const u=me(); await FBDB.collection('aposts').doc(p.id).set({text:p.text||'',emotion:p.emotion,anon:p.anon,
      uname:p.anon?'':(u?u.name:'Writer'),uct:u?u.ct:'',ts:p.ts||Date.now(),likes:0,media});
  }catch(e){ try{ await o(p); }catch(e2){} } }; }catch(e){}

/* ---- 🌍 গ্লোবাল চ্যাট রুম ---- */
function renderGChat(){
  view='gchat';
  $('#view').innerHTML=`<button class="backb" data-act="backFeed">${ic('back','width:15px;height:15px')}${esc(t('all_f'))}</button>
  <div class="surge-h" style="margin-top:4px"><h2>🌍 গ্লোবাল চ্যাট</h2><p>সব দেশের সব লেখক — এক ঘরে। শিষ্টাচার মেনে কথা বলো; নিষিদ্ধ বক্তব্য স্পঞ্জ হবে।</p></div>
  <div class="msgs" style="grid-template-columns:1fr;margin-top:14px">
   <div class="mthread">
    <div class="mtop"><span class="av" style="width:34px;height:34px;background:var(--blue);color:#fff;font-size:16px">🌍</span>
      <div style="flex:1"><b>সব লেখক · সব দেশ</b><div class="mono" style="font-size:10.5px;color:var(--mut)">${apFBReady?'<span style="color:#0B6E4F">🔥 LIVE — সংযুক্ত</span>':'⚠️ Firebase কী বসালেই লাইভ'} · <span id="apGCnt">${apGChatMsgs.length}</span> বার্তা</div></div></div>
    <div class="mlog" id="apGLog"></div>
    <div class="mform"><input id="apGIn" maxlength="300" placeholder="${esc(t('msg_ph'))}" autocomplete="off"><button class="c-send" data-act="apGSend" aria-label="send">${ic('send','width:15px;height:15px')}</button></div>
   </div></div>`;
  apGChatPaint();
  try{renderHeader();}catch(e){} try{apMarkRail('openGChat');}catch(e){} try{toggleMenu(false);}catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
function apGChatPaint(){
  const log=$('#apGLog'); if(!log) return;
  const u=me();
  log.innerHTML=(apGChatMsgs.length?'':`<div class="bub you">${apFBReady?'👋 প্রথম বার্তাটা তুমিই পাঠাও!':'⚠️ Firebase কী বসানো হলে এই চ্যাট সারা পৃথিবীর সাথে যুক্ত হবে। এখন শুধু এই ডিভাইসে।'}</div>`)
   +apGChatMsgs.map(m=>{ const mine=u&&!m.a&&m.n===u.name;
     return `<div class="bub ${mine?'me':'you'}"><b>${esc(m.n||'?')}${m.ct?' · '+esc(m.ct):''}</b><span>${esc(m.t||'')}</span><span class="mono">${timeAgo(m.ts||Date.now())}</span></div>`; }).join('');
  log.scrollTop=1e6;
  const c=$('#apGCnt'); if(c) c.textContent=apGChatMsgs.length;
}
function apGSend(){
  const inp=$('#apGIn'); const v=(inp.value||'').trim(); if(!v) return;
  if(!me()) return openAuth('login');
  if(Date.now()-apLastGSend<1500){ toast('একটু ধীরে — পরপর দ্রুত পাঠাচ্ছো','alert'); return; }
  if((typeof BAD_RE!=='undefined'&&BAD_RE.test(v))||(typeof linkBad==='function'&&linkBad(v))){ try{spongeBlock(null);}catch(e){} toast('⛔ নিষিদ্ধ বক্তব্য — স্পঞ্জ হলো','alert'); return; }
  apLastGSend=Date.now(); inp.value='';
  const u=me();
  if(apFBReady){ try{ FBDB.collection('achat').add({n:u.defAnon?'Anonymous':u.name,ct:u.ct||'',a:!!u.defAnon,t:v,ts:Date.now()}); }catch(e){} }
  else{ apGChatMsgs.push({n:u.defAnon?'Anonymous':u.name,ct:u.ct||'',t:v,ts:Date.now()}); apGChatPaint(); }
}
function apAttachChat(){ if(apGChatUnsub) return;
  try{ apGChatUnsub=FBDB.collection('achat').orderBy('ts','desc').limit(80).onSnapshot(s=>{
    apGChatMsgs=s.docs.map(d=>d.data()).reverse(); apGChatPaint();
  },err=>console.warn('gchat',err)); }catch(e){} }

/* ---- রেইল + ড্রয়ারে 🌍 বাটন ---- */
(function(){ try{ const rail=$('#rail');
  if(rail&&!rail.querySelector('[data-act="openGChat"]')){ const b=document.createElement('button');
    b.className='rl'; b.dataset.act='openGChat'; b.innerHTML=ic('users')+'<span>গ্লোবাল চ্যাট 🔥</span>';
    const sp=rail.querySelector('.rl-sp'); if(sp) rail.insertBefore(b,sp); else rail.appendChild(b); }
}catch(e){} })();
try{ const o=apDrawerOpen; apDrawerOpen=function(){ o();
  try{ const p=document.querySelector('#apDrawer .apd-panel');
    if(p&&!p.querySelector('[data-act="openGChat"]')){ const mrow=p.querySelector('.apd-item[data-act="rail"][data-i="4"]');
      const b=document.createElement('button'); b.className='apd-item'; b.dataset.act='openGChat';
      b.innerHTML=ic('users')+'<span>🌍 গ্লোবাল চ্যাট</span>';
      if(mrow) p.insertBefore(b,mrow); else p.appendChild(b); }
  }catch(e){} }; }catch(e){}

/* ---- Firebase অপেক্ষা → অটো-সংযোগ ---- */
function apFBOn(){
  try{ FBDB.collection('acmts').orderBy('ts','desc').limit(400).onSnapshot(snap=>{
    snap.docChanges().forEach(ch=>{ if(ch.type==='removed') return;
      const d=ch.doc.data(); if(!d||!d.p||!d.id) return;
      apPushed.add(d.id); apCmtStore[d.p]=apCmtStore[d.p]||[];
      if(!apCmtStore[d.p].some(x=>x.id===d.id)) apCmtStore[d.p].push({id:d.id,pid:d.pid||'',n:d.n||'Writer',a:!!d.a,t:d.t||'',ts:d.ts||0,ct:d.ct||''});
    });
    apApplyComments(); apRerenderSoon();
  },err=>console.warn('acmts',err)); }catch(e){}
  try{ apAttachChat(); }catch(e){}
  toast('🌍 গ্লোবাল মোড চালু — কমেন্ট · ফলো · চ্যাট এখন সবার সাথে সংযুক্ত!','globe');
  console.log('🌍 v3.4 গ্লোবাল লেয়ার সংযুক্ত — কমেন্ট · ফলো · চ্যাট লাইভ!');
}
function apRerenderSoon(){ if(apRrT) return; apRrT=setTimeout(()=>{ apRrT=null;
  try{ if(['feed','profile','person','saved','pview'].includes(view)) renderView(); }catch(e){} },900); }
(function(){ let n=0; const tm=setInterval(()=>{ n++;
  if(!apFBReady&&typeof FBDB!=='undefined'&&FBDB){ apFBReady=true; clearInterval(tm); apFBOn(); }
  if(n>120) clearInterval(tm); },500); })();

/* ---- ক্লিক + এন্টার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'openGChat': renderGChat(); break;
    case 'apGSend': apGSend(); break;
  }}catch(err){ console.error(err); }
});
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target&&e.target.id==='apGIn'){ e.preventDefault(); apGSend(); } });

console.log('🌍 v3.4 ready — গ্লোবাল লেয়ার প্রস্তুত (Firebase কী বসালেই অটো-লাইভ)');
/* ═══════════ END v3.4 ═══════════ */

/* ═══════════ v3.5 — 📞 আসল WebRTC কল (PeerJS ফ্রি সিগন্যালিং — Firebase ছাড়াই!) ═══════════ */
let apPeerObj=null, apPending=null, apRTC=null;

function apLoadPeerJS(){ return new Promise(res=>{ if(window.Peer) return res();
  const s=document.createElement('script'); s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  s.onload=()=>res(); s.onerror=()=>res(); document.head.appendChild(s); }); }

function apStableId(){ const h=(me()&&S.acct&&S.acct.handle)?S.acct.handle:'anon';
  return 'apcall'+Math.abs(hashStr('call:'+h)).toString(36); }
function apCodeOf(pid){ return 'AP-'+String(pid||'').replace(/^apcall/,'').toUpperCase(); }

function apPeerEnsure(cb){
  if(!me()) return openAuth('login');
  if(apPeerObj&&!apPeerObj.destroyed&&apPeerObj.open){ if(cb)cb(); return; }
  toast('📡 কল-নেটওয়ার্কে যুক্ত হচ্ছি…','phone');
  apLoadPeerJS().then(()=>{
    if(!window.Peer){ toast('⚠️ কল-লাইব্রেরি লোড হয়নি (ইন্টারনেট চেক করো)','alert'); return; }
    try{ if(apPeerObj){ try{apPeerObj.destroy();}catch(e){} apPeerObj=null; }
      const p=new Peer(apStableId(),{debug:0});
      p.on('open',()=>{ toast('📡 কল-নেটওয়ার্ক সংযুক্ত ✓','phone'); if(cb)cb(); });
      p.on('call',c=>apShowRing(c));
      p.on('error',e=>{ const ty=String((e&&e.type)||'');
        if(ty==='unavailable-id'){ try{p.destroy();}catch(e2){}
          const p2=new Peer(apStableId()+'-'+Math.random().toString(36).slice(2,6),{debug:0});
          p2.on('call',c=>apShowRing(c)); p2.on('error',()=>{}); apPeerObj=p2; if(cb)cb(); return; }
        if(ty==='peer-unavailable') toast('📵 বন্ধু এখন অনলাইন নেই (তার সাইট খোলা নেই)','alert');
        else if(apRTC&&apRTC.calling){ toast('⚠️ সংযোগ সমস্যা','alert'); apRTCCleanup(); } });
      apPeerObj=p;
    }catch(e){ console.warn('peer:',e); }
  });
}

/* ---- প্যানেল ---- */
function apRealPanel(){
  if(!me()) return openAuth('login');
  apPeerEnsure(()=>{ const b=document.getElementById('apMyCode'); if(b&&apPeerObj) b.textContent=apCodeOf(apPeerObj.id); });
  modal(`<h3>📞 আসল কল</h3><p class="sub">আসল কণ্ঠ-ছবি — বন্ধুর সাথে সরাসরি 🌍</p>
   <div class="bankcard"><div class="money-row"><span>📻 আমার কল-কোড</span><b class="mono" style="color:var(--blue)" id="apMyCode">…</b></div>
   <p class="mono" style="font-size:10.5px;color:var(--mut);margin:6px 0">এই কোডটা বন্ধুকে পাঠাও (WhatsApp-এও চলবে)। সে তার সাইটে এই কোড দিয়ে কল দিলেই সরাসরি কথা!</p>
   <button class="btn ghost sm" data-act="apMyCodeCopy">${ic('share','width:13px;height:13px')}কোড কপি</button></div>
   <div class="field"><label>বন্ধুর কল-কোড</label><input id="apCallCode" placeholder="AP-XXXXXXXX" autocomplete="off"></div>
   <div style="display:flex;gap:10px">
     <button class="btn" style="flex:1;justify-content:center" data-act="apRealVoice">📞 ভয়েস কল</button>
     <button class="btn ghost" style="flex:1;justify-content:center" data-act="apRealVideo">📹 ভিডিও কল</button>
   </div>
   <p class="mono" style="font-size:10.5px;color:var(--mut);margin-top:10px">ℹ️ রিং পেতে বন্ধুর ব্রাউজারে অটোফজি খোলা থাকতে হবে।</p>`);
}

async function apRealStart(kind){
  const code=($('#apCallCode').value||'').replace(/[^A-Za-z0-9]/g,'').toLowerCase();
  if(code.length<4){ toast('বন্ধুর কল-কোড লিখো','alert'); return; }
  const target='apcall'+code.replace(/^ap/,'');
  if(apPeerObj&&target===apPeerObj.id){ toast('নিজেকে কল দিচ্ছো? 😄','alert'); return; }
  let stream;
  try{ stream=await navigator.mediaDevices.getUserMedia(kind==='v'?{video:true,audio:true}:{audio:true}); }
  catch(e){ toast('🎤/📷 অনুমতি দাও — তারপর আবার চেষ্টা করো','alert'); return; }
  apPeerEnsure(()=>{
    try{ const call=apPeerObj.call(target,stream,{metadata:{kind}});
      apRTCBegin(call,stream,kind,true);
    }catch(e){ toast('⚠️ কল শুরু হয়নি — কোডটা আবার দেখো','alert'); }
  });
}

/* ---- কল-স্ক্রিন ---- */
function apRTCBegin(call,stream,kind,calling){
  apRTC={call,stream,kind,calling,muted:false,camOff:false,start:0,timer:null};
  const hasV=kind==='v';
  modal(`<h3 class="call-t">${kind==='v'?'📹':'📞'} কল…</h3>
   <div class="av call-av" style="background:var(--blue)">📞</div>
   <div class="call-s" id="apCallSt">${calling?'রিং হচ্ছে…':'সংযোগ আসছে…'}</div>
   <video id="apRm" class="call-video" autoplay playsinline style="display:${hasV?'block':'none'}"></video>
   <video id="apLc" class="call-video" autoplay muted playsinline style="display:${hasV?'block':'none'}"></video>
   <div style="display:flex;gap:8px">
     <button class="btn ghost" style="flex:1;justify-content:center" data-act="apMute" id="apMuteB">🎤 মিউট</button>
     ${hasV?'<button class="btn ghost" style="flex:1;justify-content:center" data-act="apCam" id="apCamB">📷 বন্ধ করো</button>':''}
   </div>
   <button class="btn call-end" data-act="apHang">⏹ কল কাটো</button>`);
  if(hasV){ const lv=document.getElementById('apLc'); if(lv) lv.srcObject=stream; }
  call.on('stream',r=>{
    const st=document.getElementById('apCallSt'); if(st) st.textContent='✅ সংযুক্ত';
    const rv=document.getElementById('apRm'); if(rv){ rv.srcObject=r; rv.style.display='block'; }
    if(apRTC&&!apRTC.start){ apRTC.start=Date.now();
      apRTC.timer=setInterval(()=>{ if(!apRTC)return; const s=Math.floor((Date.now()-apRTC.start)/1000);
        const el=document.getElementById('apCallSt'); if(el) el.textContent='⏱ '+String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); },1000); }
  });
  call.on('close',()=>{ toast('📵 কল শেষ হয়েছে','phone'); apRTCCleanup(true); });
  call.on('error',()=>{ toast('⚠️ কলে সমস্যা হলো','alert'); apRTCCleanup(true); });
}

/* ---- ইনকামিং রিং ---- */
function apShowRing(call){
  if(apRTC){ try{call.close();}catch(e){} toast('📵 এখন ব্যস্ত — কল কাটা হলো','alert'); return; }
  apPending=call;
  modal(`<h3 class="call-t">📞 ইনকামিং কল!</h3>
   <div class="av call-av" style="background:#0B6E4F">📥</div>
   <div class="call-s">কলার কোড: <b class="mono">${apCodeOf(call.peer)}</b></div>
   <div style="display:flex;gap:10px;margin-top:8px">
     <button class="btn" style="flex:1;justify-content:center;background:#0B6E4F" data-act="apAns">✅ ধরো</button>
     <button class="btn ghost" style="flex:1;justify-content:center;color:#8A2A2A;border-color:#8A2A2A" data-act="apRej">❌ কাটো</button>
   </div>`);
  try{ const B=new (window.AudioContext||window.webkitAudioContext)(); const o=B.createOscillator(),g=B.createGain();
    o.connect(g); g.connect(B.destination); o.frequency.value=880; g.gain.value=.07; o.start();
    setTimeout(()=>{try{o.stop();B.close();}catch(e){}},900); }catch(e){}
}
async function apAnswer(){
  const call=apPending; if(!call) return; apPending=null;
  let stream=null;
  try{ stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true}); }
  catch(e){ try{ stream=await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e2){
    toast('🎤 অনুমতি দাও','alert'); try{call.close();}catch(e3){} return; } }
  call.answer(stream);
  const hasV=!!(stream&&stream.getVideoTracks().length);
  apRTCBegin(call,stream,hasV?'v':'a',false);
  if(!hasV){ const rv=document.getElementById('apRm'); }
}
function apReject(){ const c=apPending; apPending=null; if(c){ try{c.close();}catch(e){} } closeModal(); }

/* ---- কন্ট্রোল + শেষ ---- */
function apToggleMute(){ if(!apRTC) return;
  const ts=apRTC.stream.getAudioTracks(); if(!ts.length) return;
  apRTC.muted=!apRTC.muted; ts.forEach(t=>t.enabled=!apRTC.muted);
  const b=document.getElementById('apMuteB'); if(b) b.textContent=apRTC.muted?'🎤 আন-মিউট':'🎤 মিউট'; }
function apToggleCam(){ if(!apRTC) return;
  const ts=apRTC.stream.getVideoTracks(); if(!ts.length){ toast('এই কলে ক্যামেরা নেই','alert'); return; }
  apRTC.camOff=!apRTC.camOff; ts.forEach(t=>t.enabled=!apRTC.camOff);
  const b=document.getElementById('apCamB'); if(b) b.textContent=apRTC.camOff?'📷 চালু করো':'📷 বন্ধ করো';
  const lv=document.getElementById('apLc'); if(lv) lv.style.display=apRTC.camOff?'none':'block'; }
function apRTCEnd(){ if(apRTC&&apRTC.call){ try{apRTC.call.close();}catch(e){} }
  if(apRTC&&apRTC.stream){ try{apRTC.stream.getTracks().forEach(t=>t.stop());}catch(e){} }
  apRTC=null; closeModal(); toast('📵 কল কাটা হলো','phone'); }
function apRTCCleanup(silent){
  if(apRTC){ if(apRTC.timer)clearInterval(apRTC.timer);
    if(apRTC.stream){ try{apRTC.stream.getTracks().forEach(t=>t.stop());}catch(e){} } }
  apRTC=null; if(!silent) try{closeModal();}catch(e){} else try{closeModal();}catch(e){} }
function apCopyMyCode(){ if(!apPeerObj||!apPeerObj.id){ toast('একটু অপেক্ষা করো…','alert'); return; }
  const c=apCodeOf(apPeerObj.id);
  if(navigator.clipboard) navigator.clipboard.writeText(c).catch(()=>{});
  toast(t('share_ok')+' — '+c,'share'); }

/* ---- মেসেজ থ্রেডে 📡 বাটন ---- */
try{ const o=injectCallBtns; injectCallBtns=function(){ o();
  try{ const top=document.querySelector('.mtop'); if(!top||top.querySelector('[data-act="apRealOpen"]')) return;
    const b=document.createElement('button'); b.className='pact'; b.dataset.act='apRealOpen';
    b.title='আসল কল (কল-কোড)'; b.style.fontWeight='700';
    b.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/></svg>';
    top.appendChild(b);
  }catch(e){} }; }catch(e){}

/* ---- লগআউট/ট্যাব-বন্ধে পরিষ্কার ---- */
try{ const o=logout; logout=function(){ try{ if(apRTC) apRTCCleanup(true);
  if(apPeerObj){ try{apPeerObj.destroy();}catch(e){} apPeerObj=null; } }catch(e){} return o(); }; }catch(e){}
window.addEventListener('beforeunload',()=>{ try{ if(apRTC){apRTC.call.close(); apRTC.stream.getTracks().forEach(t=>t.stop());} if(apPeerObj) apPeerObj.destroy(); }catch(e){} });

/* ---- ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  try{ switch(el.dataset.act){
    case 'apRealOpen': apRealPanel(); break;
    case 'apMyCodeCopy': apCopyMyCode(); break;
    case 'apRealVoice': apRealStart('a'); break;
    case 'apRealVideo': apRealStart('v'); break;
    case 'apAns': apAnswer(); break;
    case 'apRej': apReject(); break;
    case 'apMute': apToggleMute(); break;
    case 'apCam': apToggleCam(); break;
    case 'apHang': apRTCEnd(); break;
  }}catch(err){ console.error(err); }
});

console.log('📞 v3.5 ready — আসল WebRTC কল (কল-কোড সিস্টেম · Firebase ছাড়াই!)');
/* ═══════════ END v3.5 ═══════════ */

/* ═══════════ v3.6 — লোগো-বদল সরানো · রেইলে "আরো দেখুন" ═══════════ */
const AP_LIVE_ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/></svg>';

/* ---- ১) পাবলিক "লোগো বদলান" মুছে ফেলা (🏛️ Authority-এর পথ অক্ষত) ---- */
function apCleanLogoBtns(){ try{ document.querySelectorAll('[data-act="logoUp"]').forEach(el=>el.remove()); }catch(e){} }
try{ const o=renderHeader; renderHeader=function(){ const r=o(); try{apCleanLogoBtns();}catch(e){} return r; }; }catch(e){}
apCleanLogoBtns();

/* ---- ২) রেইল: নিরাপত্তার পরে "আরো দেখুন ▾" ---- */
function apRailMore(){
  try{
    const rail=document.getElementById('rail'); if(!rail) return;
    ['openReels','openGames','openPrivacy','openLiveHome','openGChat'].forEach(a=>{
      rail.querySelectorAll('[data-act="'+a+'"]').forEach(b=>{ b.style.display='none'; });
    });
    const oT=document.getElementById('apMoreTog'); if(oT) oT.remove();
    const oB=document.getElementById('apMoreBox'); if(oB) oB.remove();
    const item=(act,icn,txt)=>'<button class="rl" data-act="'+act+'">'+icn+'<span>'+txt+'</span></button>';
    const box=document.createElement('div'); box.id='apMoreBox'; box.style.display='none';
    box.innerHTML=
      item('openLiveHome',AP_LIVE_ICON,'লাইভ এখন')+
      item('openReels',ic('reels'),'রিলস')+
      item('openGames',ic('game'),'মিনি গেমস')+
      item('openGChat',ic('users'),'গ্লোবাল চ্যাট 🔥')+
      item('openPrivacy',ic('lock'),'প্রাইভেসি সেটিংস')+
      item('openAds',ic('zap'),'বিজ্ঞাপন দিন');
    const tog=document.createElement('button');
    tog.id='apMoreTog'; tog.className='rl'; tog.dataset.act='apMoreToggle';
    tog.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="transition:transform .2s"><path d="M6 9l6 6 6-6"/></svg><span>আরো দেখুন ▾</span>';
    const sec=rail.querySelector('[data-act="rail"][data-i="6"]');
    const sp=rail.querySelector('.rl-sp');
    if(sec){ sec.after(box); box.after(tog); }
    else if(sp){ rail.insertBefore(box,sp); rail.insertBefore(tog,sp); }
    else { rail.appendChild(box); rail.appendChild(tog); }
  }catch(e){}
}
apRailMore();

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act="apMoreToggle"]'); if(!el) return;
  try{
    const box=document.getElementById('apMoreBox'); if(!box) return;
    const open=box.style.display==='none';
    box.style.display=open?'flex':'none';
    const sp2=el.querySelector('span'); if(sp2) sp2.textContent=open?'কম দেখাও ▴':'আরো দেখুন ▾';
    const sv=el.querySelector('svg'); if(sv) sv.style.transform=open?'rotate(180deg)':'';
    el.classList.toggle('on',open);
  }catch(e){}
});

console.log('✨ v3.6 ready — লোগো-বদল সরানো · নিরাপত্তার পরে "আরো দেখুন" (লাইভ·রিলস·গেমস·চ্যাট·প্রাইভেসি·বিজ্ঞাপন)');
/* ═══════════ END v3.6 ═══════════ */

/* ═══ v3.7 — "আরো দেখুন" স্মার্ট: সব বিষয়ে ক্লিকেই অটো-খোলা + অবস্থা মনে থাকবে ═══ */
let AP_MORE_OPEN=false;
try{ AP_MORE_OPEN=sessionStorage.getItem('apMoreOpen')==='1'; }catch(e){}

function apMoreSet(open){
  try{
    const box=document.getElementById('apMoreBox'); if(!box) return;
    box.style.display=open?'flex':'none';
    const tog=document.getElementById('apMoreTog');
    if(tog){ const sp=tog.querySelector('span'); if(sp) sp.textContent=open?'কম দেখাও ▴':'আরো দেখুন ▾';
      const sv=tog.querySelector('svg'); if(sv) sv.style.transform=open?'rotate(180deg)':'';
      tog.classList.toggle('on',open); }
    AP_MORE_OPEN=open;
    try{ sessionStorage.setItem('apMoreOpen',open?'1':'0'); }catch(e){}
  }catch(e){}
}

/* apRailMore যেকোনো সময় চললে অবস্থা ফেরত আনবে */
try{ const o=apRailMore; apRailMore=function(){ o(); if(AP_MORE_OPEN) setTimeout(()=>apMoreSet(true),50); }; }catch(e){}
setTimeout(()=>{ if(AP_MORE_OPEN) apMoreSet(true); },400);

/* টগলের অবস্থা মনে রাখা */
document.addEventListener('click',e=>{
  if(!e.target.closest('[data-act="apMoreToggle"]')) return;
  setTimeout(()=>{ try{ const box=document.getElementById('apMoreBox');
    AP_MORE_OPEN=!!(box&&box.style.display!=='none');
    try{ sessionStorage.setItem('apMoreOpen',AP_MORE_OPEN?'1':'0'); }catch(e){}
  }catch(e){} },60);
});

/* ⭐ সব বিষয়ে ক্লিক → সাথে সাথেই ফিচার-তালিকা খোলা */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act="rail"][data-i="0"]'); if(!el) return;
  setTimeout(()=>apMoreSet(true),300);
});

console.log('✨ v3.7 — সব বিষয়ে ক্লিক = "আরো দেখুন"-এর ফিচারগুলো সাথে সাথেই দৃশ্যমান');
/* ═══════════ END v3.7 ═══════════ */

/* ═══ v3.8 — "সব বিষয়" ক্লিক = টগল (আসবে ↔ ঢুকবে, রিফ্রেশ ছাড়াই) ═══ */

/* পুরনো v3.7-এর "সবসময় খোলা" নিয়ম বন্ধ */
try{ if(typeof AP_MORE_OPEN!=='undefined') window.__apKeepOpen=AP_MORE_OPEN; }catch(e){}

document.addEventListener('click',e=>{
  /* পুরনো v3.7 হ্যান্ডলার আর কাজ করবে না — নতুন টগল নিয়ম */
},true);
(function(){
  /* v3.7-এর অটো-খোলা হ্যান্ডলার নিষ্ক্রিয় করার কৌশল: পতাকা */
  window.AP_TOGGLE_MODE=true;
})();

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act="rail"][data-i="0"]'); if(!el) return;
  /* ডাবল-ফায়ার এড়াতে সামান্য দেরি দিয়ে টগল */
  setTimeout(()=>{
    try{
      const box=document.getElementById('apMoreBox'); if(!box) return;
      const isOpen=box.style.display!=='none';
      apMoreSet(!isOpen);   /* খোলা থাকলে বন্ধ, বন্ধ থাকলে খোলা */
    }catch(e){}
  },320);
});

console.log('✨ v3.8 — "সব বিষয়" ক্লিক = টগল: ফিচার আসবে ↔ ঢুকবে (রিফ্রেশ ছাড়াই)');
/* ═══════════ END v3.8 ═══════════ */

/* ═══════════ v3.9 — ভিডিও মিনিট-ভিউ শর্ত (২১,০০০) — উত্তোলনের ৫ম শর্ত ═══════════ */
const AP_MIN_VIEWS=21000;           /* 🔑 ভবিষ্যতে বদলাতে চাইলে শুধু এই সংখ্যা বদলাও */
const AP_MIN_PER_VIDEO=3;           /* প্রতি ভিডিও-পাঠ গড়ে ধরা মিনিট (৩ মিনিট) */

/* মোট ভিডিও মিনিট-ভিউ হিসাব */
function apMinViews(){
  let min=0;
  (S.posts||[]).filter(p=>p.author==='me').forEach(p=>{
    const vids=(p.media||[]).filter(m=>m.type==='video').length;
    if(vids>0) min+=Math.round((p.reads&&p.reads.total||0)*vids*AP_MIN_PER_VIDEO);
  });
  return min;
}

/* পুরনো শর্ত-তালিকায় ৫ম শর্ত জোড়া */
try{
  const o=apWdElig; apWdElig=function(){
    const E=o();
    const mv=apMinViews();
    E.c.push({l:'⏱ ভিডিও মিনিট-ভিউ',v:fmt(mv)+' / '+fmt(AP_MIN_VIEWS),p:Math.min(100,mv/AP_MIN_VIEWS*100),ok:mv>=AP_MIN_VIEWS});
    E.ok=E.c.every(x=>x.ok);
    return E;
  };
}catch(e){}

/* "সব বিষয়"-এর নিচে রেইলে ছোট প্রগ্রেস দেখানো (ঐচ্ছিক সৌন্দর্য) */
function apMinTagHTML(){
  const mv=apMinViews();
  return `<span class="apMinTag">⏱ ${fmt(mv)}/${fmt(AP_MIN_VIEWS)} মিনিট</span>`;
}

console.log('⏱ v3.9 ready — ভিডিও মিনিট-ভিউ শর্ত:',fmt(AP_MIN_VIEWS),'মিনিট (শর্ত-৫)');
/* ═══════════ END v3.9 ═══════════ */


/* ═══════════ v4.0 — শর্ত-৬: ২ মাসে ৯টা মুখ-দেখানো লাইভ (মনিটাইজেশনের আবশ্যক) ═══════════ */
const AP_LIVE_REQ={COUNT:9,DAYS:60};   /* 🔑 সংখ্যা বদলাতে চাইলে এখানে: ৯টা লাইভ, ৬০ দিন */

/* প্রোফাইল তৈরির তারিখ (না থাকলে আজই ধরা — পুরনো ইউজার ঠকবে না) */
if(!S.joined){ S.joined=Date.now(); if(typeof save==='function') save(); }

/* শুরুর তারিখ: প্রোফাইল তৈরির দিন থেকে ৬০ দিনের জানালা */
function apLiveWindow(){ return {from:S.joined,to:S.joined+AP_LIVE_REQ.DAYS*86400000}; }

/* কোনো লাইভ "মুখ-দেখানো" গণ্য কিনা: ক্যামেরা-চালু লাইভ = host নিজের স্ট্রিম পেয়েছিল */
function apFaceLiveCount(){
  const w=apLiveWindow();
  return (S.lives||[]).filter(l=>{
    if(l.by!=='me') return false;
    if(l.ts<w.from||l.ts>w.to) return false;
    if(l.status!=='ended'&&l.status!=='terminated') return false;
    return !!l.faceCam;   /* ক্যামেরা চালু ছিল কিনা — startLive-এ চিহ্নিত হয় */
  }).length;
}

/* উত্তোলন-শর্তে ৬ষ্ঠ শর্ত জোড়া */
try{
  const o=apWdElig; apWdElig=function(){
    const E=o();
    const n=apFaceLiveCount();
    const rem=Math.max(0,Math.ceil((apLiveWindow().to-Date.now())/86400000));
    E.c.push({l:'🔴 মুখ-দেখানো লাইভ ('+AP_LIVE_REQ.DAYS+' দিনে '+AP_LIVE_REQ.COUNT+'টা)',
      v:n+' / '+AP_LIVE_REQ.COUNT+(n>=AP_LIVE_REQ.COUNT?'':' · '+rem+' দিন বাকি'),
      p:Math.min(100,n/AP_LIVE_REQ.COUNT*100),ok:n>=AP_LIVE_REQ.COUNT});
    E.ok=E.c.every(x=>x.ok);
    return E;
  };
}catch(e){}

/* লাইভ শুরুতে চিহ্নিত করা: ক্যামেরা চালু ছিল কিনা */
try{
  const o=startLive; startLive=async function(){
    await o();
    try{ if(apLive&&apLive.stream&&apLive.stream.getVideoTracks().length>0){ apLive.faceCam=true; save(); } }catch(e){}
  };
}catch(e){}

/* লাইভ হোমে প্রগ্রেস-কার্ড (লগ ইন করা ইউজারের জন্য) */
try{
  const o=renderLiveHome; renderLiveHome=function(){ o();
    try{
      if(!me()) return;
      const n=apFaceLiveCount(), need=AP_LIVE_REQ.COUNT;
      const box=document.querySelector('.live-hero'); if(!box||box.querySelector('#apLiveReq')) return;
      box.insertAdjacentHTML('afterbegin',`<div id="apLiveReq" class="bankcard" style="margin:0 0 16px">
        <div class="money-row"><span>🔴 মনিটাইজেশন শর্ত — মুখ-দেখানো লাইভ</span><b style="color:${n>=need?'#0B6E4F':'var(--blue)'}">${n} / ${need} ${n>=need?'✅':'⏳'}</b></div>
        <div class="meter"><i style="width:${Math.min(100,n/need*100)}%"></i></div>
        <p class="mono" style="font-size:10.5px;color:var(--mut);margin-top:4px">প্রোফাইল তৈরির ${AP_LIVE_REQ.DAYS} দিনে ক্যামেরা-চালু ${need}টা লাইভ সম্পন্ন করলে উত্তোলন-শর্ত পূরণ হবে। ভিডিও ছাড়া টেক্সট-লাইভ গণ্য হয় না।</p>
      </div>`);
    }catch(e){}
  };
}catch(e){}

console.log('🔴 v4.0 ready — শর্ত-৬:',AP_LIVE_REQ.DAYS,'দিনে',AP_LIVE_REQ.COUNT,'টা মুখ-দেখানো লাইভ');
/* ═══════════ END v4.0 ═══════════ */

/* ═══════════ v4.1 — 📞 নামে কল · Firebase কলার-রেজিস্ট্রি (কোড ছাড়াই!) ═══════════ */
let apCallers=[], apCallerUnsub=null;

/* অ্যাকাউন্ট ছাড়া ইউজারের জন্য ডিভাইস-আইডি (ID সংঘর্ষ রোধ) */
try{ const o=apStableId; apStableId=function(){
  if(me()&&S.acct&&S.acct.handle) return o();
  S.devId=S.devId||('dev'+Math.random().toString(36).slice(2,8));
  try{ if(typeof save==='function') save(); }catch(e){}
  return 'apcall'+Math.abs(hashStr('call:'+S.devId)).toString(36);
}; }catch(e){}

/* ---- নিজেকে রেজিস্টার + হার্টবিট ---- */
function apRegisterCaller(){
  if(!apFBReady||!me()||typeof firebase==='undefined') return;
  try{ const u=me(); const pid=apStableId();
    FBDB.collection('acallers').doc(pid).set({
      pid, n:u.defAnon?'নাম গোপন':u.name, ct:u.ct||'', a:!!u.defAnon, ts:Date.now()
    },{merge:true}).catch(()=>{});
  }catch(e){}
}
function apCallerStart(){
  if(!apFBReady||apCallerUnsub) return;
  try{ apCallerUnsub=FBDB.collection('acallers').orderBy('ts','desc').limit(60).onSnapshot(s=>{
    apCallers=s.docs.map(d=>d.data()); apPaintCallers();
  },err=>console.warn('callers',err)); }catch(e){}
}

/* ---- তালিকা আঁকা ---- */
function apPaintCallers(){
  const rows=document.getElementById('apCallerRows'); if(!rows) return;
  const now=Date.now(), my=apStableId();
  const fresh=apCallers.filter(c=>now-(c.ts||0)<7200000&&c.pid!==my);
  const st=c=>(now-(c.ts||0)<600000)?'<span class="apOnDot"></span>সক্রিয়':'🟡 সাম্প্রতিক';
  rows.innerHTML=fresh.length?fresh.map(c=>`
   <div class="rowline">
    <span class="av" style="width:36px;height:36px;background:#26437A;font-size:15px">${esc(((c.n||'?')[0]||'?').toUpperCase())}</span>
    <div class="tt"><div class="sn">${esc(c.n||'Writer')} ${c.a?'<span class="mono" style="font-size:10px;color:var(--mut)">(গোপন)</span>':''}</div>
    <div class="mt">${st(c)}${c.ct?' · '+esc(c.ct):''}</div></div>
    <button class="btn sm" data-act="apNameCall" data-pid="${esc(c.pid)}" data-k="a" title="ভয়েস কল">📞</button>
    <button class="btn ghost sm" data-act="apNameCall" data-pid="${esc(c.pid)}" data-k="v" title="ভিডিও কল">📹</button>
   </div>`).join('')
  :`<p style="color:var(--mut);font-size:13px;padding:6px 0">${apFBReady?'এখন আর কেউ অনলাইন নেই — বন্ধুকে সাইট খুলতে বলো, তালিকায় নাম উঠে যাবে!':'⚠️ Firebase সংযোগ অপেক্ষায় — ততক্ষণ কোড দিয়ে কল চলবে।'}</p>`;
}

/* ---- নামে কল শুরু ---- */
async function apNameCall(pid,kind){
  if(!me()) return openAuth('login');
  if(!apPeerObj||!apPeerObj.open){ toast('📡 কল-নেটওয়ার্কে যুক্ত হচ্ছি — ৩ সেকেন্ড পরে আবার চাপো','phone'); return apPeerEnsure(()=>{}); }
  let stream;
  try{ stream=await navigator.mediaDevices.getUserMedia(kind==='v'?{video:true,audio:true}:{audio:true}); }
  catch(e){ toast('🎤/📷 অনুমতি দাও — তারপর আবার','alert'); return; }
  try{ const call=apPeerObj.call(pid,stream,{metadata:{kind}}); apRTCBegin(call,stream,kind,true); }
  catch(e){ toast('⚠️ কল শুরু হয়নি','alert'); }
}

/* ---- কল-প্যানেলে তালিকা ঢোকানো (v3.5-এর প্যানেল অক্ষত) ---- */
try{ const o=apRealPanel; apRealPanel=function(){ o();
  setTimeout(()=>{ try{
    const c=document.getElementById('mcard'); if(!c||c.querySelector('#apCallerList')) return;
    const html=`<div id="apCallerList" style="margin:12px 0 4px">
     <h5 class="panelab" style="margin-bottom:4px">👥 অনলাইন লেখক — নামে এক ক্লিকে কল</h5>
     <p class="mono" style="font-size:10px;color:var(--mut);margin-bottom:6px">${apFBReady?'🔥 লাইভ তালিকা · কোড লাগবে না':'⚠️ Firebase সংযোগ অপেক্ষায়'}</p>
     <div id="apCallerRows"><p style="color:var(--mut);font-size:13px">তালিকা লোড হচ্ছে…</p></div>
     <div class="msep" style="margin:10px 0"></div>
     <p class="mono" style="font-size:10px;color:var(--mut)">বন্ধু তালিকায় না থাকলে নিচের কোড-পদ্ধতিও খোলা আছে।</p></div>`;
    const f=c.querySelector('.field');
    if(f) f.insertAdjacentHTML('beforebegin',html); else c.insertAdjacentHTML('beforeend',html);
    apPaintCallers(); apRegisterCaller(); apCallerStart();
  }catch(e){} },140);
}; }catch(e){}

/* ---- লাইফসাইকেল জোড়া ---- */
try{ const o=apFBOn; apFBOn=function(){ o(); try{ apRegisterCaller(); apCallerStart(); }catch(e){} }; }catch(e){}
try{ const o=doLogin; doLogin=function(){ const r=o.apply(this,arguments);
  setTimeout(()=>{ try{ apRegisterCaller(); apCallerStart(); }catch(e){} },2500); return r; }; }catch(e){}
try{ const o=logout; logout=function(){ try{
  if(apFBReady&&me()&&apPeerObj&&apPeerObj.open){ FBDB.collection('acallers').doc(apStableId()).delete().catch(()=>{}); }
}catch(e){} return o(); }; }catch(e){}

/* হার্টবিট: ৪ মিনিট পরপর নিজেকে "সক্রিয়" মার্ক */
setInterval(()=>{ try{ if(me()&&apFBReady&&!document.hidden) apRegisterCaller(); }catch(e){} },240000);
document.addEventListener('visibilitychange',()=>{ try{ if(!document.hidden&&me()&&apFBReady) apRegisterCaller(); }catch(e){} });
window.addEventListener('beforeunload',()=>{ try{ if(apFBReady&&me()&&apPeerObj&&apPeerObj.open){ FBDB.collection('acallers').doc(apStableId()).delete(); } }catch(e){} });

/* ---- ক্লিক-হ্যান্ডলার ---- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act="apNameCall"]'); if(!el) return;
  try{ apNameCall(el.dataset.pid,el.dataset.k||'a'); }catch(err){ console.error(err); }
});

console.log('📞 v4.1 ready — নামে এক ক্লিকে কল (Firebase কলার-রেজিস্ট্রি · কোড মুক্ত!)');
/* ═══════════ END v4.1 ═══════════ */
/* ═══ v4.3b — লাইভ ডায়াগনস্টিক + সরাসরি ফিক্স ═══ */
window.startLive=async function(){
  try{
    const title=($('#lvTitle')?($('#lvTitle').value||'').trim():'');
    if(!me()){ toast('⚠️ আগে লগ ইন করো!','alert'); return openAuth('login'); }
    if(title.length<3){ toast('শিরোনাম লেখো (৩+ অক্ষর)','alert'); return; }
    toast('✅ ধাপ ১ ঠিক — এখন ক্যামেরা-অনুমতির জন্য অপেক্ষা…','check');
    let stream=null;
    try{ stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true}); }
    catch(e){ toast('📷 ক্যামেরা/মাইক ব্লকড! ঠিকানার পাশের আইকন → Site settings → Camera+Mic: Allow','alert'); return; }
    toast('✅ ধাপ ২ ঠিক — ক্যামেরা পাওয়া গেছে!','check');
    const topic=$('#lvTopic')?$('#lvTopic').value:'story';
    apLive={id:uid(),host:me().name,by:'me',title,topic,stream,ts:Date.now(),viewers:1,reports:0,chat:[],status:'live',faceCam:!!(stream.getVideoTracks().length)};
    S.lives.unshift(apLive); save();
    toast('🔴 আপনি এখন লাইভে!','send');
    renderLiveRoom();
    if(apViewTimer){clearInterval(apViewTimer);}
    apViewTimer=setInterval(()=>{ if(!apLive)return;
      apLive.viewers=Math.max(1,apLive.viewers+(Math.random()<.5?1:-1));
      const v=$('#lvViews'); if(v) v.textContent='👁 '+fmt(apLive.viewers); },6000);
  }catch(e){
    toast('⚠️ লাইভে সমস্যা ধরা পড়েছে: '+e.message,'alert');
    console.error('LIVE DEBUG:',e);
  }
};
console.log('🔧 v4.3b — লাইভ ডায়াগনস্টিক চালু');
/* ═══ END v4.3b ═══ */
/* ═══ v4.3c — লাইভ শুরু হলেই সেটআপ-মোডাল অটো-বন্ধ (লাইভ অক্ষত!) ═══ */
function apCloseModalSafe(){
  try{
    const m=document.getElementById('modal');
    if(m) m.classList.remove('open');
    const c=document.getElementById('mcard');
    if(c) c.innerHTML='';
  }catch(e){}
}
try{
  const __prevStart=window.startLive;
  window.startLive=async function(){
    await __prevStart();
    try{ if(apLive&&apLive.status==='live'){ apCloseModalSafe(); } }catch(e){}
  };
}catch(e){}
console.log('✨ v4.3c — লাইভ শুরু = সেটআপ-বাক্স অটো-বন্ধ (লাইভ আর কাটবে না)');
/* ═══ END v4.3c ═══ */
/* ═══════════ v4.4 — 🔔 লাইভ-নোটিফিকেশন · হোম-ব্যানার · রেইল-বিন্দু (গ্লোবাল) ═══════════ */

/* ---- নতুন লাইভের খবর ছড়ানো (Firebase-যোগে সবার কাছে) ---- */
function apAnnounceLive(L){
  try{
    /* ১) আমার বেলেও রেকর্ড (ইতিহাস) */
    addNotif('🔴 '+L.host+' এখন লাইভে — '+L.title,'globe');
    /* ২) Firebase-এ "লাইভ-প্রচার" জমা — সবার কাছে পৌঁছাবে */
    if(apFBReady&&typeof firebase!=='undefined'){
      FBDB.collection('alivenow').doc(L.id).set({
        host:L.host,title:L.title,topic:L.topic||'',ts:L.ts,views:L.viewers||1
      }).catch(()=>{});
    }
    /* ৩) এই ডিভাইসে তাৎক্ষণিক ব্যানার + রেইল-বিন্দু */
    apLiveBannerShow(L); apRailDotShow();
  }catch(e){}
}
function apAnnounceLiveEnd(L){
  try{
    if(apFBReady&&typeof firebase!=='undefined'){
      FBDB.collection('alivenow').doc(L.id).delete().catch(()=>{});
    }
    apLiveBannerHide();
  }catch(e){}
}

/* ---- হোম-ফিডের উপরে লাল ব্যানার ---- */
var apLiveBanners=window.apLiveBanners||[];

function apLiveBannerShow(L){
  try{
    if(document.getElementById('apLb-'+L.id)) return;
    const b=document.createElement('button');
    b.id='apLb-'+L.id; b.dataset.act='openLiveHome';
    b.style.cssText='width:100%;background:linear-gradient(120deg,#C0195B,#FF3B30);color:#fff;border:none;border-radius:12px;padding:12px 16px;font-weight:700;font-size:14.5px;display:flex;align-items:center;gap:10px;margin:0 0 14px;box-shadow:0 10px 30px -12px rgba(192,25,91,.6);min-height:48px;cursor:pointer';
    b.innerHTML='<span style="font-size:20px">🔴</span><span style="flex:1;text-align:start">'+esc(L.host)+' এখন লাইভে!<span style="display:block;font-weight:400;font-size:12.5px;opacity:.9">'+esc(L.title)+'</span></span><span class="live-dot" style="background:#fff"></span><span style="font-family:var(--mono);font-size:11px">দেখো →</span>';
    b.onclick=()=>{ try{renderLiveHome();}catch(e){} };
    document.body.appendChild(b);
    b.style.position='fixed'; b.style.top='70px'; b.style.left='50%'; b.style.transform='translateX(-50%)';
    b.style.width='min(560px,92vw)'; b.style.zIndex='85';
    apLiveBanners.push(b);
  }catch(e){}
}
function apLiveBannerHide(){
  try{ apLiveBanners.forEach(b=>b.remove()); apLiveBanners=[]; }catch(e){}
}

/* ---- রেইলে লাল বিন্দু ---- */
function apRailDotShow(){
  try{
    const b=document.querySelector('[data-act="openLiveHome"]'); if(!b) return;
    if(b.querySelector('.apLd')) return;
    const d=document.createElement('span'); d.className='apLd';
    d.style.cssText='position:absolute;top:6px;inset-inline-end:10px;width:9px;height:9px;border-radius:50%;background:#FF3B30;border:1.5px solid #fff;animation:apLivePulse 1.2s infinite';
    b.style.position='relative'; b.appendChild(d);
  }catch(e){}
}

/* ---- অন্যদের লাইভ-ঘোষণা শোনা (গ্লোবাল) ---- */
function apListenLives(){
  if(!apFBReady||apLiveListenOn) return; apLiveListenOn=true;
  try{
    FBDB.collection('alivenow').orderBy('ts','desc').limit(5).onSnapshot(s=>{
      try{
        const myHost=apLive?apLive.id:null;
        s.docs.forEach(d=>{
          const L=d.data();
          const seenKey='apSeenLive_'+d.id;
          if(!sessionStorage.getItem(seenKey)&&d.id!==myHost){
            sessionStorage.setItem(seenKey,'1');
            addNotif('🔴 '+L.host+' এখন লাইভে — '+L.title,'globe');
            apLiveBannerShow(Object.assign({id:d.id},L));
            apRailDotShow();
            renderBellPanel&&renderBellPanel();
          }
        });
        apLiveBannerHide();
        s.docs.forEach(d=>{
          const L=Object.assign({id:d.id},d.data());
          apLiveBannerShow(L);
        });
        /* যেগুলো আর প্রচারে নেই, সেগুলোর ব্যানার সরাও */
        document.querySelectorAll('[id^="apLb-"]').forEach(b=>{
          const id=b.id.replace('apLb-','');
          if(!s.docs.some(d=>d.id===id)) b.remove();
        });
      }catch(e){}
    },err=>console.warn('alivenow',err));
  }catch(e){}
}
var apLiveListenOn=false;
try{ const o=apFBOn; apFBOn=function(){ o(); try{ apListenLives(); }catch(e){} }; }catch(e){}

/* ---- লাইভ শুরু/শেষে ঘোষণা জোড়া ---- */
try{
  const o=window.startLive;
  window.startLive=async function(){
    await o();
    try{ if(apLive&&apLive.status==='live'){ apAnnounceLive(apLive); apCloseModalSafe&&apCloseModalSafe(); } }catch(e){}
  };
}catch(e){}
try{
  const o=endLive;
  endLive=function(){ const L=apLive?Object.assign({},apLive):null;
    const r=o.apply(this,arguments);
    try{ if(L) apAnnounceLiveEnd(L); }catch(e){}
    return r;
  };
}catch(e){}
try{
  const o=liveTerminate;
  liveTerminate=function(){ const L=apLive?Object.assign({},apLive):null;
    const r=o.apply(this,arguments);
    try{ if(L) apAnnounceLiveEnd(L); }catch(e){}
    return r;
  };
}catch(e){}

/* ---- রিল-বাদী টেনে তোলা: ফিডে গেলেই বর্তমান লাইভ-ব্যানার আঁকো ---- */
try{
  const o=renderFeed; renderFeed=function(){ o();
    try{ if(!apFBReady) return;
      FBDB.collection('alivenow').orderBy('ts','desc').limit(3).get().then(s=>{
        apLiveBannerHide();
        s.docs.forEach(d=>{ apLiveBannerShow(Object.assign({id:d.id},d.data())); });
      }).catch(()=>{});
    }catch(e){}
  };
}catch(e){}

console.log('🔔 v4.4 ready — লাইভ-নোটিফিকেশন · হোম-ব্যানার · রেইল-বিন্দু (গ্লোবাল!)');
/* ═══════════ END v4.4 ═══════════ */
/* ═══ v4.5 — বাসি-লাইভ পরিষ্কার · মাইক-মিটার · হার্টবিট ═══ */
var apMicTimer=null;

/* ১) বাসি লাইভ পরিষ্কার (৩০ মিনিটের পুরনো 'live' = স্বয়ংক্রিয়-সমাপ্ত) */
function apCleanStaleLives(){
  try{
    const LIMIT=30*60000;
    let ch=false;
    (S.lives||[]).forEach(l=>{
      if(l.status==='live'&&Date.now()-(l.ts||0)>LIMIT){ l.status='ended'; l.reason='স্বয়ংক্রিয়-সমাপ্ত'; ch=true; }
    });
    if(ch&&typeof save==='function') save();
    if(apFBReady&&typeof firebase!=='undefined'){
      FBDB.collection('alivenow').get().then(s=>{
        s.docs.forEach(d=>{ const L=d.data()||{};
          if(Date.now()-(L.ts||0)>LIMIT) d.ref.delete().catch(()=>{});
        });
      }).catch(()=>{});
    }
  }catch(e){}
}
apCleanStaleLives();
setInterval(apCleanStaleLives,120000);

/* ২) হার্টবিট: লাইভ চলাকালীন Firebase-এ তাজা রাখে (ট্যাব-বন্ধ হলেও ৩০ মিনিটে পরিষ্কার) */
setInterval(()=>{ try{
  if(apLive&&apLive.status==='live'&&apFBReady&&typeof firebase!=='undefined'){
    FBDB.collection('alivenow').doc(apLive.id).update({ts:Date.now(),views:apLive.viewers||1}).catch(()=>{});
  }
}catch(e){} },60000);

/* ৩) 🎤 মাইক-মিটার: কথা বললে বারগুলো নড়বে — প্রমাণ শব্দ ধরা পড়ছে! */
try{
  const o=renderLiveRoom; renderLiveRoom=function(){ o();
    try{
      if(!apLive||!apLive.stream) return;
      if(!apLive.stream.getAudioTracks().length) return;
      const player=document.querySelector('.live-player'); if(!player) return;
      if(player.querySelector('#apMicMeter')) return;
      const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
      const ac=new AC();
      const src=ac.createMediaStreamSource(apLive.stream);
      const an=ac.createAnalyser(); an.fftSize=256;
      src.connect(an);
      const box=document.createElement('div'); box.id='apMicMeter';
      box.title='মাইক সচল — কথা বললে বার নড়বে (নিজের কণ্ঠ ইচ্ছাকৃতভাবে নীরব, ইকো এড়াতে!)';
      box.style.cssText='position:absolute;top:12px;inset-inline-start:12px;z-index:4;display:flex;gap:3px;align-items:flex-end;height:28px;background:rgba(0,0,0,.5);padding:5px 9px;border-radius:99px';
      box.innerHTML='<span style="font-size:11px;margin-inline-end:2px">🎤</span>';
      for(let i=0;i<5;i++){ const b=document.createElement('span');
        b.style.cssText='width:4px;background:#0B6E4F;border-radius:2px;height:4px;transition:height .1s';
        box.appendChild(b); }
      player.appendChild(box);
      const bars=[...box.querySelectorAll('span')].slice(1);
      const data=new Uint8Array(an.frequencyBinCount);
      if(apMicTimer) clearInterval(apMicTimer);
      apMicTimer=setInterval(()=>{
        try{
          if(!apLive||!apLive.status||apLive.status!=='live'){ clearInterval(apMicTimer); try{ac.close();}catch(e){} return; }
          an.getByteFrequencyData(data);
          let sum=0; for(let i=0;i<data.length;i++) sum+=data[i];
          const avg=sum/data.length;
          bars.forEach((b,i)=>{ b.style.height=Math.max(3,Math.min(20,(avg/255)*22*(1-i*0.12)))+'px';
            b.style.background=avg>22?'#FFD60A':'#0B6E4F'; });
        }catch(e){}
      },120);
    }catch(e){}
  };
}catch(e){}

/* ৪) ট্যাব বন্ধ করলেও লাইভ-রেকর্ড ঠিকমতো শেষ হোক */
window.addEventListener('pagehide',()=>{ try{ if(apLive) endLive(true); }catch(e){} });

console.log('🧹 v4.5 ready — বাসি-লাইভ পরিষ্কার · 🎤 মাইক-মিটার · হার্টবিট');
/* ═══════════ END v4.5 ═══════════ */
/* ═══════════ v4.6 — 📼 লাইভ রেকর্ডিং + অটো-ডাউনলোড (শব্দসহ!) ═══════════ */
var apRec=null, apRecChunks=[];
function apRecStart(stream){
  try{
    if(!window.MediaRecorder){ toast('এই ব্রাউজারে রেকর্ডিং সাপোর্ট নেই','alert'); return; }
    apRecChunks=[];
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')?'video/webm;codecs=vp8,opus':(MediaRecorder.isTypeSupported('video/webm')?'video/webm':'');
    apRec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:800000,audioBitsPerSecond:64000}:undefined);
    apRec.ondataavailable=e=>{ if(e.data&&e.data.size) apRecChunks.push(e.data); };
    apRec.start(2000);
    toast('📼 রেকর্ডিং চালু — লাইভ শেষে ভিডিও সেভ হবে','vid');
  }catch(e){ console.warn('rec start',e); }
}
function apRecStopAndSave(){
  try{
    if(!apRec||apRec.state==='inactive') return;
    apRec.onstop=()=>{
      try{
        const blob=new Blob(apRecChunks,{type:'video/webm'});
        if(blob.size<2000){ toast('রেকর্ডিং খুব ছোট — সেভ হয়নি','alert'); return; }
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        const d=new Date(), p=n=>String(n).padStart(2,'0');
        a.href=url;
        a.download='autophagy-live-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+'.webm';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),8000);
        toast('📼 লাইভ-ভিডিও ডাউনলোড হয়েছে! ডাউনলোড ফোল্ডার দেখো — চাইলে এটা পোস্ট আকারে আপলোড দাও, লাইক-কমেন্ট-শেয়ার সব চলবে! 🎬','check');
        addNotif('📼 লাইভ-রেকর্ডিং সেভ হয়েছে (ডাউনলোড ফোল্ডারে)','vid');
      }catch(e){ console.warn('rec save',e); }
    };
    apRec.stop();
  }catch(e){}
}

/* লাইভ শেষ/বাতিলে সেভ */
try{ const o=endLive; endLive=function(){ try{ apRecStopAndSave(); }catch(e){} return o.apply(this,arguments); }; }catch(e){}
try{ const o=liveTerminate; liveTerminate=function(){ try{ apRecStopAndSave(); }catch(e){} return o.apply(this,arguments); }; }catch(e){}
/* ট্যাব হঠাৎ বন্ধেও যতটুকু রেকর্ড হয়েছে বাঁচার চেষ্টা */
window.addEventListener('beforeunload',()=>{ try{ if(apRec&&apRec.state==='recording') apRecStopAndSave(); }catch(e){} });
console.log('📼 v4.6 ready — লাইভ রেকর্ডিং + অটো-ডাউনলোড (শব্দসহ)');
/* ═══════════ END v4.6 ═══════════ */
/* ═══════════ v4.7 — 📼 লাইভ-রিপ্লে: লাইভ শেষ → অটো-পোস্ট (লাইক·কমেন্ট·শেয়ার-সক্ষম) ═══════════ */
var apRecBlob=null;
function apRecSaveBlob(){ try{
  if(!apRec||apRec.state==='inactive') return;
  apRec.onstop=()=>{
    try{
      apRecBlob=new Blob(apRecChunks,{type:'video/webm'});
      if(apRecBlob.size<2000){ apRecBlob=null; toast('রেকর্ডিং খুব ছোট','alert'); return; }
      apLiveReplayPost();
    }catch(e){ console.warn('replay save',e); }
  };
  apRec.stop();
}catch(e){} }
function apLiveReplayPost(){
  try{
    const L=(typeof apLive!=='undefined'&&apLive)?Object.assign({},apLive):null;
    const S2=(typeof S!=='undefined')?S:null; if(!S2) return;
    const u=me(); if(!u) return;
    const dur=L&&L.ts?Math.floor((Date.now()-L.ts)/1000):0;
    const min=Math.floor(dur/60), sec=dur%60;
    const txt=(L?('[📼 লাইভ-রিপ্লে] '+L.title):'[📼 লাইভ-রিপ্লে]')+' — সময়: '+min+'মি '+sec+'সে';
    const id='rply'+Date.now().toString(36);
    S2.replays=S2.replays||[];
    S2.replays.push({id,blob:apRecBlob,ts:Date.now()});
    if(S2.replays.length>8){ const old=S2.replays.shift();
      try{ if(old&&old.url) URL.revokeObjectURL(old.url); }catch(e){} }
    if(typeof save==='function') save();
    const post={
      id:uid(), author:'me', anon:!!u.defAnon, emotion:'story', text:txt,
      media:[{type:'video',url:URL.createObjectURL(apRecBlob),replay:true,rid:id}],
      ts:Date.now(), likes:[], shares:0, comments:[],
      reads:{total:3,by:{BD:2,US:1},byAge:{'18-24':2,'25-34':1}}
    };
    S2.posts.unshift(post);
    apRecBlob=null;
    toast('📼 লাইভ-রিপ্লে ফিডে প্রকাশিত! লাইক·কমেন্ট·শেয়ার চলবে (এই ডিভাইসে) 🎬','check');
    addNotif('📼 লাইভ-রিপ্লে পোস্ট হয়েছে — ফিডে দেখো!','vid');
    if(typeof save==='function') save();
    try{ go('feed'); }catch(e){ try{renderView();}catch(e2){} }
  }catch(e){ console.warn('replay post',e); }
}
/* endLive-এর ডাউনলোড-অংশ রিপ্লে-পোস্টে রূপান্তর */
try{ apRecStopAndSave=apRecSaveBlob; }catch(e){}
try{ const o=window.startLive; window.startLive=async function(){
  await o();
  try{ if(apLive&&apLive.stream&&apLive.stream.getVideoTracks().length) apRecStart(apLive.stream); }catch(e){}
}; }catch(e){}
console.log('📼 v4.7 ready — লাইভ-রিপ্লে অটো-পোস্ট (ফিডে দেখা+শোনা+লাইক+কমেন্ট+শেয়ার)');
/* ═══════════ END v4.7 ═══════════ */
/* ═══════════ v4.8 — 📼 রিপ্লে স্থায়ী (IndexedDB) + ☁️ Firebase Storage আপলোড ═══════════ */
var APDB=null;
function apIdbOpen(){ return new Promise(res=>{ if(APDB) return res(APDB);
  try{ const rq=indexedDB.open('ap_replays',1);
    rq.onupgradeneeded=ev=>{ try{ ev.target.result.createObjectStore('vids'); }catch(e){} };
    rq.onsuccess=ev=>{ APDB=ev.target.result; res(APDB); }; rq.onerror=()=>res(null);
  }catch(e){ res(null); } }); }
function apIdbPut(k,blob){ return apIdbOpen().then(db=>new Promise(res=>{ if(!db) return res(false);
  try{ const tx=db.transaction('vids','readwrite'); tx.objectStore('vids').put(blob,k);
    tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } })); }
function apIdbGet(k){ return apIdbOpen().then(db=>new Promise(res=>{ if(!db) return res(null);
  try{ const rq=db.transaction('vids').objectStore('vids').get(k);
    rq.onsuccess=()=>res(rq.result||null); rq.onerror=()=>res(null); }catch(e){ res(null); } })); }

/* রিপ্লে-পোস্ট সংশোধন: blob → IndexedDB-স্থায়ী + ঐচ্ছিক-ক্লাউড আপলোড */
try{ const o=apLiveReplayPost; apLiveReplayPost=async function(){
  try{
    const u=me(); if(!u) return;
    const L=(typeof apLive!=='undefined'&&apLive)?Object.assign({},apLive):null;
    const dur=L&&L.ts?Math.floor((Date.now()-L.ts)/1000):0;
    const txt=(L?('[📼 লাইভ-রিপ্লে] '+L.title):'[📼 লাইভ-রিপ্লে]')+' — সময়: '+Math.floor(dur/60)+'মি '+(dur%60)+'সে';
    const k='rp'+Date.now().toString(36);
    const ok=await apIdbPut(k,apRecBlob);
    const m={type:'video',rid:k,replay:true};
    if(ok){ m.idb=k; m.url='idb:'+k; }
    else { m.url=URL.createObjectURL(apRecBlob); }
    /* ☁️ Firebase Storage আপলোড (চালু থাকলে — সবার ডিভাইসে যাবে!) */
    if(typeof firebase!=='undefined'&&firebase.storage&&apFBReady){
      try{
        const task=firebase.storage().ref('lives/'+k+'.webm').put(apRecBlob);
        toast('☁️ ভিডিও ক্লাউডে আপলোড হচ্ছে…','send');
        const snap=await task;
        m.cloud=await snap.ref.getDownloadURL();
        m.url=m.cloud;
        toast('☁️ ক্লাউড-আপলোড সম্পন্ন — সবার ডিভাইসে দেখা যাবে! 🌍','check');
      }catch(e){ console.warn('storage upload',e); }
    }
    const post={ id:uid(), author:'me', anon:!!u.defAnon, emotion:'story', text:txt,
      media:[m], ts:Date.now(), likes:[], shares:0, comments:[],
      reads:{total:3,by:{BD:2},byAge:{'18-24':3}} };
    S.posts.unshift(post);
    S.replays=(S.replays||[]).filter(r=>r.id!==k);
    apRecBlob=null; save();
    toast('📼 লাইভ-রিপ্লে ফিডে প্রকাশিত! লাইক·কমেন্ট·শেয়ার চলবে 🎬','check');
    addNotif('📼 লাইভ-রিপ্লে পোস্ট হয়েছে — ফিডে দেখো!','vid');
    try{ go('feed'); }catch(e){ renderView(); }
  }catch(e){ console.warn('replay',e); }
}; }catch(e){}

/* পোস্ট-রেন্ডারের সময় idb: ভিডিও ফেরত আনা (রিফ্রেশ-প্রুফ!) */
try{ const o=postCard; postCard=function(p){
  let h=o(p);
  try{
    (p.media||[]).forEach((m,i)=>{
      if(m.idb&&m.url&&m.url.indexOf('idb:')===0){
        setTimeout(async()=>{ try{
          const el=document.querySelector('#post-'+p.id+' video');
          if(el&&el.dataset.apFixed!=='1'){ el.dataset.apFixed='1';
            const b=await apIdbGet(m.idb);
            if(b) el.src=URL.createObjectURL(b);
          }
        }catch(e){} },80);
      }
    });
  }catch(e){}
  return h;
}; }catch(e){}

/* বাসি-রেকর্ড-নিখোঁজ মেরামত: কোড নতুন-লোডে হারানো url ঠিক করা */
async function apRepairReplays(){
  try{
    let ch=false;
    for(const p of S.posts||[]){
      for(const m of p.media||[]){
        if(m.idb&&(!m.url||m.url.indexOf('idb:')===0)){
          const b=await apIdbGet(m.idb);
          if(b){ m.url=URL.createObjectURL(b); ch=true; }
        }
      }
    }
    if(ch){ save(); if(view==='feed') renderFeed(); }
  }catch(e){}
}
apRepairReplays();

console.log('📼 v4.8 ready — রিপ্লে স্থায়ী (IndexedDB) + ☁️ ক্লাউড-আপলোড-প্রস্তুত');
/* ═══════════ END v4.8 ═══════════ */
/* ═══ v4.9 — ☁️ Storage SDK অটো-লোড + রিপ্লে-ব্যাকফিল (সবার কাছে!) ═══ */
function apEnsureStorageSDK(){ return new Promise(res=>{
  try{ if(firebase.storage) return res(true);
    const s=document.createElement('script');
    s.src='https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';
    s.onload=()=>res(!!firebase.storage); s.onerror=()=>res(false);
    document.head.appendChild(s);
  }catch(e){ res(false); } }); }
async function apCloudBackfill(){
  try{
    if(!apFBReady||!me()) return;
    const ok=await apEnsureStorageSDK(); if(!ok) return;
    let n=0;
    for(const p of S.posts||[]){
      if(p.author!=='me'||n>=3) continue;
      for(const m of p.media||[]){
        if(m.idb&&!m.cloud&&n<3){
          const b=await apIdbGet(m.idb); if(!b||b.size>60*1024*1024) continue;
          try{ const snap=await firebase.storage().ref('lives/'+m.idb+'.webm').put(b);
            m.cloud=await snap.ref.getDownloadURL(); m.url=m.cloud; n++;
          }catch(e){ console.warn('backfill',e); }
        }
      }
    }
    if(n){ save(); toast('☁️ '+n+'টা লাইভ-রিপ্লে ক্লাউডে উঠল — সবাই এখন দেখবে! 🌍','check'); if(view==='feed') renderFeed(); }
  }catch(e){}
}
try{ const o=apFBOn; apFBOn=function(){ o(); setTimeout(()=>{ apCloudBackfill(); },4000); }; }catch(e){}
setTimeout(()=>{ if(apFBReady) apCloudBackfill(); },6000);
console.log('☁️ v4.9 ready — Storage চালু হলেই রিপ্লে স্বয়ংক্রিয় ক্লাউডে!');
/* ═══ END v4.9 ═══ */
/* ═══════════ v5.0 — 🎧 লাইভ দর্শক-স্ট্রিম (WebRTC · সম্পূর্ণ ফ্রি!) ═══════════ */
var apBroadPeer=null, apViewerCalls=[], apViewPeer=null;

/* --- হোস্ট: সম্প্রচার-পথ খোলা --- */
async function apBroadStart(stream){
  try{
    await apLoadPeerJS();
    if(!window.Peer||!apLive) return;
    if(apBroadPeer){ try{apBroadPeer.destroy();}catch(e){} }
    const pid='aplv-'+apLive.id+'-'+Math.random().toString(36).slice(2,6);
    const p=new Peer(pid,{debug:0}); apBroadPeer=p;
    p.on('open',()=>{
      try{
        if(apFBReady&&typeof firebase!=='undefined'&&apLive){
          FBDB.collection('alivenow').doc(apLive.id).update({pid}).catch(()=>{});
        }
        toast('📡 দর্শকরা এখন তোমার লাইভে যুক্ত হতে পারবে!','globe');
      }catch(e){}
    });
    p.on('call',call=>{
      try{
        call.answer(stream); apViewerCalls.push(call);
        apLive.viewers=(apLive.viewers||0)+1;
        const v=document.getElementById('lvViews'); if(v) v.textContent='👁 '+fmt(apLive.viewers);
        if(apFBReady&&typeof firebase!=='undefined'&&apLive){
          FBDB.collection('alivenow').doc(apLive.id).update({views:apLive.viewers}).catch(()=>{});
        }
        call.on('close',()=>{ apViewerCalls=apViewerCalls.filter(c=>c!==call);
          apLive.viewers=Math.max(0,(apLive.viewers||1)-1); });
      }catch(e){}
    });
    p.on('error',e=>console.warn('broadpeer',e));
  }catch(e){ console.warn('broadstart',e); }
}
function apBroadStop(){
  try{ apViewerCalls.forEach(c=>{try{c.close();}catch(e){}}); apViewerCalls=[]; }catch(e){}
  try{ if(apBroadPeer){apBroadPeer.destroy(); apBroadPeer=null;} }catch(e){}
}

/* --- দর্শক: সংযোগ ও দেখা-শোনা --- */
function apWatchReal(liveId,base){
  return (async()=>{
    try{
      if(!window.Peer) await apLoadPeerJS();
      if(!window.Peer){ toast('⚠️ সংযোগ-লাইব্রেরি লোড হয়নি','alert'); return; }
      let pid=base||null;
      if(apFBReady&&typeof firebase!=='undefined'){
        try{ const d=await FBDB.collection('alivenow').doc(liveId).get();
          if(d.exists&&d.data().pid) pid=d.data().pid;
        }catch(e){}
      }
      if(!pid){ toast('📡 স্ট্রিম-পথ এখনো খোলেনি — ৫ সেকেন্ড পরে আবার চাপো','alert'); return; }
      if(apViewPeer){ try{apViewPeer.destroy();}catch(e){} }
      const p=new Peer(null,{debug:0}); apViewPeer=p;
      p.on('open',()=>{
        try{
          let dummy=null; try{ dummy=new MediaStream(); }catch(e){}
          const call=p.call(pid,dummy||undefined);
          let got=false;
          call.on('stream',remote=>{
            got=true;
            const v=document.getElementById('lvVid');
            if(v){ v.srcObject=remote; v.muted=false; v.volume=1; if(v.play) v.play().catch(()=>{}); }
            toast('🔴 সরাসরি সংযুক্ত — দেখছো ও শুনছো! 🎧','globe');
          });
          call.on('close',()=>{ toast(got?'সংযোগ শেষ':'📵 হোস্ট লাইভ বন্ধ করেছে','phone'); });
          call.on('error',()=>{});
          setTimeout(()=>{ if(!got&&apViewPeer===p) toast('⏳ হোস্ট এখনো সংযোগ নিচ্ছে না — একটু পরে আবার','alert'); },12000);
        }catch(e){ toast('⚠️ কল শুরু হয়নি','alert'); }
      });
      p.on('error',e=>{ const t=String((e&&e.type)||'');
        if(t==='peer-unavailable') toast('📵 এই লাইভটা সম্প্রতি শেষ হয়ে গেছে','alert');
        else toast('⚠️ সংযোগ সমস্যা','alert');
      });
    }catch(e){ console.warn('watch',e); }
  })();
}

/* liveWatch প্রতিস্থাপন — এখন আসল স্ট্রিম! */
try{ liveWatch=function(id){
  try{
    (async()=>{
      let info=null, base=null;
      if(apFBReady&&typeof firebase!=='undefined'){
        try{ const d=await FBDB.collection('alivenow').doc(id).get();
          if(d.exists){ const dd=d.data(); base=dd.pid||null;
            info=Object.assign({id:id},dd); }
        }catch(e){}
      }
      if(!info){ const L=(S.lives||[]).find(x=>x.id===id); if(L) info=Object.assign({id:id},L); }
      if(!info){ toast('এই লাইভটা আর চালু নেই','alert'); try{renderLiveHome();}catch(e){} return; }
      apLive=Object.assign({},info,{id:id,stream:null,by:'viewer',viewers:(info.views||info.viewers||1)});
      renderLiveRoom();
      apWatchReal(id,base);
    })();
  }catch(e){}
}; }catch(e){}

/* হোস্ট-র‍্যাপার */
try{ const o=window.startLive; window.startLive=async function(){
  await o();
  try{ if(apLive&&apLive.status==='live'&&apLive.stream) apBroadStart(apLive.stream); }catch(e){}
}; }catch(e){}
try{ const o=endLive; endLive=function(){
  try{ if(apLive&&apLive.by==='viewer'){
      if(apViewPeer){try{apViewPeer.destroy();}catch(e){} apViewPeer=null;}
      apLive=null; return;
  } }catch(e){}
  const r=o.apply(this,arguments);
  try{ apBroadStop(); }catch(e){}
  return r;
}; }catch(e){}
try{ const o=liveTerminate; liveTerminate=function(){
  try{ if(apLive&&apLive.by==='viewer'){
      toast('🚩 রিপোর্ট পাঠানো হয়েছে — কর্তৃপক্ষ দেখবে','check');
      if(apViewPeer){try{apViewPeer.destroy();}catch(e){} apViewPeer=null;}
      apLive=null; try{renderLiveHome();}catch(e){} return;
  } }catch(e){}
  return o.apply(this,arguments);
}; }catch(e){}

/* দর্শক লাইভ-রুম ছেড়ে গেলে সংযোগ পরিষ্কার */
setInterval(()=>{ try{
  if(apLive&&apLive.by==='viewer'&&view!=='liveRoom'){
    if(apViewPeer){try{apViewPeer.destroy();}catch(e){} apViewPeer=null;}
    apLive=null;
  }
}catch(e){} },1500);

console.log('🎧 v5.0 ready — লাইভ দর্শক-স্ট্রিম (WebRTC · ফ্রি!)');
/* ═══════════ END v5.0 ═══════════ */
/* ═══════════ v5.1 — 📣 হেডার-ঘোষণা দণ্ড (লাইভ/পোস্ট — সব পাতায় স্থায়ী!) ═══════════ */
var apAnnBar=null;

function apAnnShow(ann){
  try{
    /* আগের বার বদলাও (নতুন ঘোষণা পুরনোটাকে ছাপিয়ে যায়) */
    apAnnHide();
    const b=document.createElement('button');
    b.id='apAnnBar'; b.dataset.act='apAnnGo';
    b.dataset.kind=ann.kind||'live'; b.dataset.pid=ann.pid||''; b.dataset.ref=ann.ref||'';
    const isLive=(ann.kind==='live');
    b.style.cssText='position:fixed;top:62px;left:0;right:0;z-index:64;background:'+(isLive
      ?'linear-gradient(120deg,#C0195B,#FF3B30)'
      :'linear-gradient(120deg,#0B6E4F,#0E7490)')
      +';color:#fff;border:none;border-radius:0;padding:9px 16px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:10px;box-shadow:0 6px 20px -8px rgba(11,11,22,.5);min-height:44px;cursor:pointer;text-align:start;width:100%';
    b.innerHTML=(isLive?'<span style="font-size:17px">🔴</span>'
      +'<span style="flex:1">'+esc(ann.text||'')+' — এখন লাইভে!<span style="display:block;font-weight:400;font-size:12px;opacity:.92">'+esc(ann.title||'')+'</span></span>'
      :'<span style="font-size:17px">📝</span><span style="flex:1">'+esc(ann.text||'')+' নতুন পোস্ট দিয়েছে!</span>')
      +'<span class="live-dot" style="background:#fff"></span><span style="font-family:var(--mono);font-size:11px;white-space:nowrap">'+(isLive?'লাইভে যাও →':'দেখো →')+'</span>'
      +'<span data-act="apAnnClose" style="position:absolute;top:2px;inset-inline-end:10px;font-size:14px;opacity:.8;padding:6px 8px;min-width:28px;min-height:28px">✕</span>';
    document.body.appendChild(b);
    /* পেজ-কনটেন্ট বাধা না খাক — বডির উপরে জায়গা নাও */
    document.body.style.paddingTop='44px';
    apAnnBar=b;
  }catch(e){}
}
function apAnnHide(){ try{
  const b=document.getElementById('apAnnBar'); if(b) b.remove();
  apAnnBar=null;
  document.body.style.paddingTop='';
}catch(e){} }

/* --- Firebase ঘোষণা-ঘর --- */
function apAnnSet(ann){
  try{
    if(!apFBReady||typeof firebase==='undefined') return;
    FBDB.collection('aannounce').doc('current').set({
      kind:ann.kind||'live', pid:ann.pid||'', name:ann.name||'', title:ann.title||'',
      ref:ann.ref||'', text:ann.name||'', ts:ann.ts||Date.now()
    },{merge:true}).catch(()=>{});
  }catch(e){}
}
function apAnnClear(){ try{
  if(apFBReady&&typeof firebase!=='undefined'){ FBDB.collection('aannounce').doc('current').delete().catch(()=>{}); }
  apAnnHide();
}catch(e){} }

/* --- সবার শোনা (সব দেশের সব বন্ধুর হেডারে পৌঁছাবে!) --- */
function apAnnListen(){
  if(!apFBReady||window.apAnnOn) return; window.apAnnOn=true;
  try{
    FBDB.collection('aannounce').doc('current').onSnapshot(s=>{
      try{
        if(!s.exists){ apAnnHide(); return; }
        const a=s.data(); if(!a||!a.kind) { apAnnHide(); return; }
        const fresh=Date.now()-(a.ts||0)<(24*3600000);   /* ২৪ ঘণ্টা পুরনো হলে নিজে থেকেই মিলবে */
        if(!fresh){ apAnnHide(); return; }
        apAnnShow(a);
      }catch(e){}
    },err=>console.warn('ann',err));
  }catch(e){}
}

/* --- ক্লিক-পথ: ব্যানারে চাপলে সরাসরি লাইভ/পোস্টে --- */
document.addEventListener('click',e=>{
  try{
    if(e.target.closest('[data-act="apAnnClose"]')){
      e.stopPropagation(); apAnnHide(); return;   /* শুধু এই ডিভাইসে বন্ধ — অন্যে থাকবে */
    }
    const b=e.target.closest('[data-act="apAnnGo"]'); if(!b) return;
    e.preventDefault();
    if(b.dataset.kind==='live'){ try{renderLiveHome();}catch(e){} return; }
    /* পোস্ট-ঘোষণা → ফিডে গিয়ে সেই পোস্টে স্ক্রল */
    try{
      go('feed');
      setTimeout(()=>{
        const n=document.getElementById('post-'+b.dataset.ref);
        if(n){ n.scrollIntoView({behavior:'smooth',block:'center'});
          n.style.boxShadow='0 0 0 3px var(--blue)'; setTimeout(()=>{try{n.style.boxShadow='';}catch(e){}},2500); }
      },350);
    }catch(e){}
  }catch(err){}
});

/* --- লাইভ শুরু/শেষে ঘোষণা জোড়া (v4.4-এর ব্যানারের সঙ্গী) --- */
try{ const o=window.startLive; window.startLive=async function(){
  await o();
  try{ if(apLive&&apLive.status==='live'){
    apAnnSet({kind:'live',pid:apLive.id,name:apLive.host,title:apLive.title,ts:apLive.ts});
  } }catch(e){}
}; }catch(e){}
try{ const o=endLive; endLive=function(){
  try{ if(apLive&&apLive.by!=='viewer') apAnnClear(); }catch(e){}
  return o.apply(this,arguments);
}; }catch(e){}
try{ const o=liveTerminate; liveTerminate=function(){
  try{ if(apLive&&apLive.by!=='viewer') apAnnClear(); }catch(e){}
  return o.apply(this,arguments);
}; }catch(e){}

/* --- নতুন পোস্টেও ঘোষণা (তোমার চাওয়া অনুযায়ী!) --- */
try{ const o=publish; publish=function(){
  const before=S.posts.length;
  o.apply(this,arguments);
  try{
    const p=S.posts[0];
    if(p&&S.posts.length>before&&p.author==='me'&&me()){
      apAnnSet({kind:'post',pid:me().id||'',name:me().defAnon?'কেউ একজন':me().name,ref:p.id,ts:Date.now()});
    }
  }catch(e){}
}; }catch(e){}

/* --- Firebase-যুক্ত হলেই শোনা শুরু --- */
try{ const o=apFBOn; apFBOn=function(){ o(); try{ apAnnListen(); }catch(e){} }; }catch(e){}
setTimeout(()=>{ try{ if(apFBReady) apAnnListen(); }catch(e){} },5000);

console.log('📣 v5.1 ready — হেডার-ঘোষণা দণ্ড (লাইভ/পোস্ট · সব পাতায় · গ্লোবাল!)');
/* ═══════════ END v5.1 ═══════════ */
/* ═══ v5.2 — কেটে  v5.5  কোড বসানো হয়েছে ) ═══ */

/* ═══ v5.3 — 📣 দণ্ডে ক্লিক = সরাসরি লাইভে ঢোকা (দেখা+শোনা এক ক্লিকে!) ═══ */

/* সরাসরি স্ট্রিম-শুরু (লাইভ-হোম লাফিয়ে!) */
function apAnnWatchDirect(ann){
  try{
    if(!me()) return openAuth('login');
    /* নিজের লাইভে নিজেই ক্লিক করলে → নিজের লাইভ-রুমে ফেরা */
    if(apLive&&apLive.id===ann.pid&&apLive.by==='me'){ try{renderLiveRoom();}catch(e){} return; }
    /* লাইভ-হোম না খুলেই সরাসরি দর্শক-রুম বানাও */
    apLive=Object.assign({id:ann.pid},{id:ann.pid,host:ann.name||'লাইভ',title:ann.title||'লাইভ',topic:'story',by:'viewer',stream:null,viewers:1});
    view='liveRoom';
    $('#view').innerHTML=`<button class="backb" data-act="backFeed">${ic('back','width:15px;height:15px')}${esc(t('all_f'))}</button>
    <div class="live-hero"><div class="live-grid">
     <div class="live-player">
      <span class="lv-top"><span class="live-badge"><span class="live-dot"></span>LIVE</span><span class="stamp">লাইভ</span><span class="lv-views" id="lvViews">👁 …</span></span>
      <video id="lvVid" autoplay playsinline></video>
      <div class="lv-cap"><b>${esc(apLive.title)}</b> · 👤 ${esc(apLive.host)}</div>
     </div>
     <div class="live-chat">
      <div class="lc-h">💬 লাইভ চ্যাট</div>
      <div class="lc-log" id="lvChatLog"></div>
      <div class="lc-form"><input id="lvChatIn" maxlength="140" placeholder="মেসেজ লেখো…" autocomplete="off"><button class="c-send" data-act="liveChatSend">${ic('send','width:15px;height:15px')}</button></div>
     </div></div>
     <div class="lv-rep">📡 সরাসরি সংযোগের চেষ্টা চলছে…</div>
    </div>`;
    try{renderHeader();}catch(e){} try{toggleMenu(false);}catch(e){}
    window.scrollTo({top:0,behavior:'smooth'});
    /* সংযোগ শুরু */
    apWatchReal(ann.pid, ann.ref||null);
  }catch(e){ console.warn('annWatch',e); toast('⚠️ লাইভে ঢোকা গেল না — আবার চাপো','alert'); }
}

/* পুরনো ক্লিক-হ্যান্ডলার আপগ্রেড: live = সরাসরি স্ট্রিম! */
try{
  /* আগের হ্যান্ডলার বাদ দেওয়া সম্ভব না (একসাথে চলে) — তাই ফ্ল্যাগ ব্যবহার */
  window.apAnnDirect=true;
}catch(e){}

/* নতুন হ্যান্ডলার — আগে চলবে, তারপর পুরনোটা বাতিল-গণনায় ফেলা */
document.addEventListener('click',e=>{
  try{
    const close=e.target.closest('[data-act="apAnnClose"]');
    if(close){ e.stopPropagation(); e.preventDefault(); apAnnHide(); return; }
    const b=e.target.closest('[data-act="apAnnGo"]'); if(!b) return;
    e.stopPropagation(); e.preventDefault();
    if(b.dataset.kind==='live'){
      /* সরাসরি দর্শক-স্ট্রিম! (লাইভ-হোম লাফ না দিয়ে!) */
      apAnnWatchDirect({pid:b.dataset.pid||'', name:'', title:'', ref:b.dataset.ref||''});
      /* নাম-শিরোনাম ধরতে Firestore থেকে পড়ে শিরোনাম-আপডেট */
      try{
        if(apFBReady&&typeof firebase!=='undefined'&&b.dataset.pid){
          FBDB.collection('alivenow').doc(b.dataset.pid).get().then(d=>{
            if(d.exists&&apLive&&apLive.id===b.dataset.pid&&apLive.by==='viewer'){
              const L=d.data();
              apLive.host=L.host||apLive.host; apLive.title=L.title||apLive.title;
              const cap=document.querySelector('.lv-cap'); 
              if(cap) cap.innerHTML='<b>'+esc(apLive.title||'')+'</b> · 👤 '+esc(apLive.host||'');
            }
          }).catch(()=>{});
        }
      }catch(e){}
      return;
    }
  }catch(err){}
},true);   /* capture-phase: পুরনো হ্যান্ডলারের আগেই কাজ শেষ! */

/* দর্শক-চ্যাটে লাইভ চলাকালীন গ্লোবাল চ্যাট-সংযোগ (বোনাস!) */
try{ const o=renderLiveRoom; renderLiveRoom=function(){ o();
  try{ if(apLive&&apLive.by==='viewer'){
    const log=document.getElementById('lvChatLog');
    if(log&&!log.dataset.apG){ log.dataset.apG='1';
      /* গ্লোবাল চ্যাটের শেষ ২০ বার্তা দেখাও — দর্শক হোস্টের চ্যাটে লিখতে পারবে */
      apGChatMsgs.slice(-20).forEach(m=>{
        log.insertAdjacentHTML('beforeend','<div class="bub you"><b>'+esc(m.n||'?')+'</b><span>'+esc(m.t||'')+'</span></div>');
      });
      log.scrollTop=1e6;
    }
  } }catch(e){}
}; }catch(e){}

console.log('📣 v5.3 ready — দণ্ডে ক্লিক = সরাসরি লাইভে (দেখা+শোনা এক ক্লিকে!)');
/* ═══════════ END v5.3 ═══════════ */
/* ═══ v5.4 — দর্শক-স্ট্রিম শক্তিশালী: অটো-রিট্রাই · সাউন্ড-আনলক · প্লে-বাটন ═══ */
var apViewRetry=null;

/* উন্নত দর্শক-সংযোগ: ৩ বার চেষ্টা + শব্দ-আনলক */
function apWatchRealV2(liveId,base,retryN){
  retryN=retryN||0;
  return (async()=>{
    try{
      if(!window.Peer) await apLoadPeerJS();
      if(!window.Peer){ toast('⚠️ লাইব্রেরি লোড হয়নি','alert'); return; }
      let pid=base||null;
      if(apFBReady&&typeof firebase!=='undefined'){
        try{ const d=await FBDB.collection('alivenow').doc(liveId).get();
          if(d.exists&&d.data().pid) pid=d.data().pid;
        }catch(e){}
      }
      if(!pid){
        if(retryN<3){ toast('⏳ হোস্টের পথ খুলছে… ('+(retryN+1)+'/৩)','phone');
          setTimeout(()=>apWatchRealV2(liveId,base,retryN+1),3500); return; }
        toast('📵 হোস্ট পথ পাওয়া যায়নি — পরে আবার চাপো','alert'); return;
      }
      if(apViewPeer){ try{apViewPeer.destroy();}catch(e){} }
      const p=new Peer(null,{debug:0}); apViewPeer=p;
      p.on('open',()=>{
        try{
          const call=p.call(pid,undefined);
          let got=false;
          call.on('stream',remote=>{
            got=true;
            if(apViewRetry){clearTimeout(apViewRetry); apViewRetry=null;}
            const v=document.getElementById('lvVid');
            if(v){
              v.srcObject=remote;
              v.muted=false; v.volume=1;
              /* শব্দ-আনলক: ইউজার-জেসচারে প্লে */
              const tryPlay=()=>{ v.play().then(()=>{
                toast('🔴 সংযুক্ত! দেখছো ও শুনছো 🎧','globe');
                const w=document.querySelector('.lv-rep'); if(w) w.style.display='none';
              }).catch(()=>{ /* ব্লক হলে প্লে-বাটন দেখাও */ }); };
              tryPlay();
              v.onclick=()=>{ v.muted=false; v.play().catch(()=>{}); };
            }
          });
          call.on('close',()=>{ toast(got?'সংযোগ শেষ':'📵 হোস্ট লাইভ বন্ধ করেছে','phone'); });
          call.on('error',()=>{});
          /* সময়সীমা: ১০ সেকেন্ডে না পেলে আবার চেষ্টা */
          setTimeout(()=>{ if(!got&&retryN<3&&apViewPeer===p){
            toast('⏳ আবার চেষ্টা… ('+(retryN+1)+'/৩)','phone');
            try{p.destroy();}catch(e){} apWatchRealV2(liveId,base,retryN+1);
          } },10000);
        }catch(e){ toast('⚠️ কল শুরু হয়নি','alert'); }
      });
      p.on('error',e=>{ const t=String((e&&e.type)||'');
        if(t==='peer-unavailable'){ if(retryN<3){ toast('⏳ আবার চেষ্টা… ('+(retryN+1)+'/৩)','phone');
          try{p.destroy();}catch(e2){} apWatchRealV2(liveId,base,retryN+1); }
          else toast('📵 হোস্ট লাইভ বন্ধ করেছে বা পথ বন্ধ','alert'); }
      });
    }catch(e){ console.warn('watch2',e); }
  })();
}
try{ apWatchReal=apWatchRealV2; }catch(e){}

/* কালো-বক্স হলে বড় প্লে-বাটন (শব্দ-আনলকের জন্য এক ক্লিক!) */
try{ const o=renderLiveRoom; renderLiveRoom=function(){ o();
  try{
    if(apLive&&apLive.by==='viewer'){
      setTimeout(()=>{
        const v=document.getElementById('lvVid'); const pl=document.querySelector('.live-player');
        if(v&&pl&&!v.srcObject&&!pl.querySelector('#apPlayBig')){
          const b=document.createElement('button'); b.id='apPlayBig';
          b.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.55);color:#fff;font-size:17px;font-weight:700;border:none;z-index:5;cursor:pointer;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center';
          b.innerHTML='<span style="font-size:44px">▶️</span><span>লাইভ শুরু করতে চাপ দাও</span>';
          b.onclick=()=>{ b.remove(); if(typeof apAnnWatchDirect==='function'&&window.__apLastAnn){ apAnnWatchDirect(window.__apLastAnn); } };
          pl.appendChild(b);
        }
      },6000);
    }
  }catch(e){}
}; }catch(e){}

/* দণ্ড-ক্লিকে শেষ-ঘোষণা মনে রাখা (প্লে-বাটনে আবার চেষ্টার জন্য) */
try{
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-act="apAnnGo"]');
    if(b&&b.dataset.kind==='live'){ window.__apLastAnn={pid:b.dataset.pid||'',name:'',title:'',ref:b.dataset.ref||''}; }
  },true);
}catch(e){}

console.log('🎧 v5.4 ready — অটো-রিট্রাই ×৩ · শব্দ-আনলক · প্লে-বাটন');
/* ═══ END v5.4 ═══ */
/* ═══ v5.5 — সব মৃত blob-ভিডিও পরিষ্কার (রিপ্লে+সাধারণ পোস্ট — সম্পূর্ণ!) ═══ */
(function(){ try{
  let fixedPosts=0, removedPosts=0;
  (S.posts||[]).forEach(p=>{
    let changed=false;
    const keep=(p.media||[]).filter(m=>{
      const deadBlob=m.url&&m.url.indexOf('blob:')===0;   /* লোড-সময়ের blob = মৃত */
      if(deadBlob){ changed=true; return false; }
      return true;
    });
    if(changed){
      p.media=keep;
      /* পোস্টে ভিডিও-ছবি কিছুই না রইল + লেখাও নেই → পোস্টই মুছো (রিপ্লে-খালি!) */
      const hasMedia=keep.length>0;
      const hasText=(p.text||'').trim().length>0;
      const isReplay=(p.text||'').indexOf('লাইভ-রিপ্লে')>=0;
      if(!hasMedia&&(!hasText||isReplay)){ p._apDead=true; removedPosts++; }
      else fixedPosts++;
    }
  });
  S.posts=(S.posts||[]).filter(p=>!p._apDead);
  if(fixedPosts||removedPosts){
    save();
    console.log('🧹 v5.5 — মৃত-ভিডিও পরিষ্কার: '+fixedPosts+' পোস্ট ঠিক, '+removedPosts+' খালি-পোস্ট মুছে');
  }
}catch(e){} })();
/* প্রতি ১৫ সেকেন্ডে একবার নজরদারি (নতুন মৃত-লিংক আসলে সঙ্গে সঙ্গে পরিষ্কার) */
setInterval(()=>{ try{
  let n=0;
  (S.posts||[]).forEach(p=>{
    const before=(p.media||[]).length;
    p.media=(p.media||[]).filter(m=>!(m.url&&m.url.indexOf('blob:')===0&&!m.idb&&!m.cloud));
    n+=before-(p.media||[]).length;
  });
  if(n){ save(); if(view==='feed') renderFeed(); }
}catch(e){} },15000);
console.log('🧹 v5.5 ready — সব-মৃত-ব্লব স্ক্যানার সচল');
/* ═══ END v5.5 ═══ */
/* ═══════════ v5.6 — স্ট্রিম-রোগের মূল ফিক্স + Storage-নীরব ═══════════ */

/* ১) Storage-ব্যাকফিল নীরব (storageBucket নেই = স্কিপ — কার্ড সিদ্ধান্ত সম্মান!) */
try{ apCloudBackfill=async function(){
  if(typeof FB_CONFIG!=='undefined'&&FB_CONFIG.storageBucket){ console.log('☁️ Storage আছে — পরে চালু করা যাবে'); return; }
  console.log('☁️ Storage বন্ধ (কার্ড ছাড়া) — ব্যাকফিল স্কিপ ✓');
}; }catch(e){}

/* ২) ডাবল-রেকর্ডার গার্ড (v4.6+v4.7 দুবার জোড়া ছিল) */
try{ const o=apRecStart; apRecStart=function(s){
  try{ if(apRec&&apRec.state==='recording'){ console.log('📼 রেকর্ডার ইতিমধ্যে চলছে — স্কিপ'); return; } }catch(e){}
  return o(s);
}; }catch(e){}

/* ৩) হোস্ট: নির্ধারিত-পথ + সাথে-সাথেই Firebase-এ পথ-নিবন্ধন */
try{ apBroadStart=async function(stream){
  try{
    if(!apLive||!stream) return;
    await apLoadPeerJS();
    if(!window.Peer){ toast('⚠️ সংযোগ-লাইব্রেরি লোড হয়নি','alert'); return; }
    if(apBroadPeer){ try{apBroadPeer.destroy();}catch(e){} apBroadPeer=null; }
    const mk=(suf)=>{
      const pid='aplv-'+apLive.id+(suf||'');
      apBroadPeer=new Peer(pid,{debug:0});
      const p=apBroadPeer;
      /* ⭐ পথ-নাম এখনই লেখা হবে — open-এর অপেক্ষা নেই! */
      try{ if(apFBReady&&typeof firebase!=='undefined'&&apLive){
        FBDB.collection('alivenow').doc(apLive.id).update({pid:pid}).catch(()=>{});
      } }catch(e){}
      p.on('open',()=>{ toast('📡 দর্শকরা এখন তোমার লাইভে যুক্ত হতে পারবে!','globe'); });
      p.on('call',call=>{
        try{ call.answer(stream); apViewerCalls.push(call);
          apLive.viewers=(apLive.viewers||0)+1;
          const v=document.getElementById('lvViews'); if(v) v.textContent='👁 '+fmt(apLive.viewers);
          if(apFBReady&&typeof firebase!=='undefined'&&apLive){ FBDB.collection('alivenow').doc(apLive.id).update({views:apLive.viewers}).catch(()=>{}); }
          call.on('close',()=>{ apViewerCalls=apViewerCalls.filter(c=>c!==call);
            if(apLive) apLive.viewers=Math.max(0,(apLive.viewers||1)-1); });
        }catch(e){}
      });
      p.on('error',e=>{ const t=String((e&&e.type)||'');
        if(t==='unavailable-id'&&!suf){ try{p.destroy();}catch(e2){} mk('-r1'); }
        else console.warn('broadpeer',e);
      });
    };
    mk('');
  }catch(e){ console.warn('broadstart3',e); }
}; }catch(e){}

/* ৪) দর্শক: নির্ধারিত-পথ + ডামি-স্ট্রিম (PeerJS-এর আসল দাবি!) + ৩-রিট্রাই */
try{ apWatchReal=async function(liveId,base,n){
  n=n||0;
  try{
    if(!window.Peer) await apLoadPeerJS();
    if(!window.Peer){ toast('⚠️ সংযোগ-লাইব্রেরি লোড হয়নি','alert'); return; }
    let pid=base||null;
    if(!pid&&apFBReady&&typeof firebase!=='undefined'){
      try{ const d=await FBDB.collection('alivenow').doc(liveId).get();
        if(d.exists&&d.data().pid) pid=d.data().pid;
      }catch(e){}
    }
    if(!pid) pid='aplv-'+liveId;   /* ⭐ সরাসরি গণনা — ডক না পেলেও চেষ্টা! */
    if(apViewPeer){ try{apViewPeer.destroy();}catch(e){} }
    const p=new Peer(null,{debug:0}); apViewPeer=p;
    p.on('open',()=>{
      try{
        /* ⭐ ডামি-স্ট্রিম — PeerJS-এর বাধ্যতামূলক দাবি! */
        let dummy=null;
        try{ dummy=new MediaStream(); }catch(e){}
        let call=null;
        try{ call=p.call(pid,dummy); }
        catch(e2){ try{ call=p.call(pid,new MediaStream()); }catch(e3){ toast('⚠️ কল শুরু হয়নি ('+e3.message+')','alert'); return; } }
        let got=false;
        call.on('stream',remote=>{
          got=true;
          const v=document.getElementById('lvVid');
          if(v){ v.srcObject=remote; v.muted=false; v.volume=1;
            v.play().then(()=>{
              toast('🔴 সংযুক্ত! দেখছো ও শুনছো 🎧','globe');
              const w=document.querySelector('.lv-rep'); if(w) w.style.display='none';
            }).catch(()=>{ toast('🔊 শব্দ-ভিডিও চালু করতে পর্দায় ভিডিওটায় একবার চাপ দাও','vid'); });
            v.onclick=()=>{ try{ v.muted=false; v.play(); }catch(e){} };
          }
        });
        call.on('close',()=>{ toast(got?'সংযোগ শেষ':'📵 হোস্ট লাইভ বন্ধ করেছে','phone'); });
        call.on('error',()=>{});
        setTimeout(()=>{ if(!got&&n<3&&apViewPeer===p){
          toast('⏳ হোস্টের পথ খুলছে — আবার চেষ্টা ('+(n+1)+'/৩)','phone');
          try{p.destroy();}catch(e){}
          apWatchReal(liveId,base,n+1);
        } },9000);
      }catch(e){ console.warn('watch3-open',e); }
    });
    p.on('error',e=>{ const t=String((e&&e.type)||'');
      if(t==='peer-unavailable'&&n<3){
        toast('⏳ হোস্টের পথ খুলছে — আবার চেষ্টা ('+(n+1)+'/৩)','phone');
        try{p.destroy();}catch(e){}
        apWatchReal(liveId,base,n+1);
      } else if(t==='peer-unavailable'){ toast('📵 হোস্ট লাইভ বন্ধ করেছে বা পথ বন্ধ','alert'); }
    });
  }catch(e){ console.warn('watch3',e); }
}; }catch(e){}

console.log('🎧 v5.6 ready — নির্ধারিত-পথ · ডামি-স্ট্রিম · Storage-নীরব');
/* ═══════════ END v5.6 ═══════════ */
/* ═══════════ v5.7 — 🎧 লাইভ স্ট্রিম: Firebase-সিগন্যালিং (PeerJS-মুক্ত! · ফ্রি!) ═══════════ */
try{ const o=apCloudBackfill; apCloudBackfill=async function(){ /* নীরব */ }; }catch(e){}

var apRTCPc=null;
function apRtcLogSet(sig){ try{ if(apFBReady&&typeof firebase!=='undefined'&&apLive){ FBDB.collection('aliveSignals').doc(apLive.id).set(sig,{merge:true}).catch(()=>{}); } }catch(e){} }
function apRtcLogGet(liveId){ return new Promise(res=>{ try{
  if(!apFBReady||typeof firebase==='undefined') return res(null);
  FBDB.collection('aliveSignals').doc(liveId).get().then(d=>res(d.exists?d.data():null)).catch(()=>res(null));
}catch(e){ res(null); } }); }
function apRtcListen(liveId,cb){ try{
  if(!apFBReady||typeof firebase==='undefined') return;
  FBDB.collection('aliveSignals').doc(liveId).onSnapshot(s=>{ if(s.exists) cb(s.data()); },()=>{});
}catch(e){} }

/* ডামি-স্ট্রিম (ফাংশন-ডাকা PeerJS পথ নয় — সরাসরি RTCPeerConnection!) */
function apDummyStream(){ try{ return new MediaStream(); }catch(e){ return null; } }

/* ---- হোস্ট: সম্প্রচার ---- */
try{ apBroadStart=async function(stream){
  try{
    if(!apLive||!stream) return;
    if(!window.RTCPeerConnection){ toast('⚠️ এই ব্রাউজারে স্ট্রিম সাপোর্ট নেই','alert'); return; }
    if(apRTCPc){ try{apRTCPc.close();}catch(e){} }
    const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});
    apRTCPc=pc;
    stream.getTracks().forEach(t=>{ try{ pc.addTrack(t,stream); }catch(e){} });
    const cands=[];
    pc.onicecandidate=e=>{ if(e.candidate){ cands.push(e.candidate.toJSON()); apRtcLogSet({hCands:cands.slice()}); } };
    apRtcLogSet({hostOn:true,ts:Date.now()});
    const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
    apRtcLogSet({offer:{type:offer.type,sdp:offer.sdp}});
    /* দর্শকের answer-এর অপেক্ষা */
    apRtcListen(apLive.id,async d=>{
      try{
        if(d&&d.answer&&!pc.remoteDescription){
          await pc.setRemoteDescription(new RTCSessionDescription(d.answer));
        }
        if(d&&d.vCands&&d.vCands.length){ d.vCands.forEach(c=>{ try{ pc.addIceCandidate(new RTCIceCandidate(c)); }catch(e){} }); }
      }catch(e){}
    });
    pc.onconnectionstatechange=()=>{
      try{ if(['connected','failed','disconnected'].includes(pc.connectionState)){
        if(pc.connectionState==='connected'&&apLive){
          apLive.viewers=(apLive.viewers||0)+1;
          const v=document.getElementById('lvViews'); if(v) v.textContent='👁 '+fmt(apLive.viewers);
          toast('📺 একজন দর্শক সংযুক্ত!','users');
        }
      } }catch(e){}
    };
    toast('📡 সম্প্রচার-পথ খোলা — দর্শকরা যুক্ত হতে পারবে!','globe');
  }catch(e){ console.warn('broad-fb',e); }
}; }catch(e){}

/* ---- দর্শক: দেখা-শোনা ---- */
try{ apWatchReal=async function(liveId,base,n){
  n=n||0;
  try{
    if(!window.RTCPeerConnection){ toast('⚠️ স্ট্রিম সাপোর্ট নেই','alert'); return; }
    const sig=await apRtcLogGet(liveId);
    if(!sig||!sig.offer||!sig.hostOn){
      if(n<12){ if(n===0) toast('⏳ হোস্টের পথ খুলছে…','phone');
        setTimeout(()=>apWatchReal(liveId,base,n+1),2500); return; }
      toast('📵 হোস্ট লাইভ বন্ধ করেছে বা পথ বন্ধ','alert'); return;
    }
    if(apRTCPc){ try{apRTCPc.close();}catch(e){} }
    const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});
    apRTCPc=pc;
    /* রিসিভ-অনলি: ডামি-ট্র্যাক দরকার নেই! */
    try{ pc.addTransceiver('video',{direction:'recvonly'}); pc.addTransceiver('audio',{direction:'recvonly'}); }catch(e){}
    const vcands=[];
    pc.onicecandidate=e=>{ if(e.candidate){ vcands.push(e.candidate.toJSON()); apRtcLogSet.call(null); try{
      if(apFBReady&&typeof firebase!=='undefined'){ FBDB.collection('aliveSignals').doc(liveId).set({vCands:vcands.slice()},{merge:true}).catch(()=>{}); }
    }catch(e){} } };
    pc.ontrack=e=>{
      try{
        const remote=e.streams&&e.streams[0];
        const v=document.getElementById('lvVid');
        if(v&&remote){ v.srcObject=remote; v.muted=false; v.volume=1;
          v.play().then(()=>{ toast('🔴 সংযুক্ত! দেখছো ও শুনছো 🎧','globe');
            const w=document.querySelector('.lv-rep'); if(w) w.style.display='none';
          }).catch(()=>{ toast('🔊 শব্দ-চালু করতে ভিডিওতে একবার চাপ দাও','vid'); });
          v.onclick=()=>{ try{ v.muted=false; v.play(); }catch(e){} };
        }
      }catch(e){}
    };
    pc.onconnectionstatechange=()=>{ try{
      if(pc.connectionState==='connected'){ toast('🔴 সরাসরি সংযুক্ত! 🎧','globe'); }
    }catch(e){} };
    await pc.setRemoteDescription(new RTCSessionDescription(sig.offer));
    const answer=await pc.createAnswer(); await pc.setLocalDescription(answer);
    if(apFBReady&&typeof firebase!=='undefined'){
      FBDB.collection('aliveSignals').doc(liveId).set({answer:{type:answer.type,sdp:answer.sdp},vCands:vcands.slice()},{merge:true}).catch(()=>{});
    }
  }catch(e){ console.warn('watch-fb',e); toast('⚠️ সংযোগ সমস্যা — আবার চাপো','alert'); }
}; }catch(e){}

/* লাইভ শেষে সিগন্যাল-পরিষ্কার */
try{ const o=apAnnClear; apAnnClear=function(){ try{
  if(apLive&&apFBReady&&typeof firebase!=='undefined'){ FBDB.collection('aliveSignals').doc(apLive.id).delete().catch(()=>{}); }
}catch(e){} return o.apply(this,arguments); }; }catch(e){}

console.log('🎧 v5.7 ready — লাইভ স্ট্রিম: Firebase-সিগন্যালিং (PeerJS-মুক্ত · ফ্রি!)');
/* ═══════════ END v5.7 ═══════════ */
/* ═══════════ v5.8 — লাইভ-দর্শক চূড়ান্ত: PeerJS-সম্পূর্ণ-বহিষ্কার + মোবাইল-দণ্ড-ফিক্স ═══════════ */

/* ---- পর্দা-১: দণ্ড (ব্যানার) নতুন করে — মোবাইল-ক্লিক-প্রস্তুত! ---- */
function apAnnBarMake(a){
  try{
    apAnnHide();
    const b=document.createElement('div');
    b.id='apAnnBar'; b.setAttribute('data-ann','1');
    b.style.cssText='position:fixed;top:62px;left:0;right:0;z-index:200;background:linear-gradient(120deg,#C0195B,#FF3B30);color:#fff;border-radius:0;padding:12px 14px;font-weight:700;font-size:14.5px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px -8px rgba(0,0,0,.5);min-height:50px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent';
    b.innerHTML='<span style="font-size:18px">🔴</span>'
     +'<span style="flex:1">'+esc(a.name||'লাইভ')+' এখন লাইভে!<span style="display:block;font-weight:400;font-size:12.5px;opacity:.93">'+esc(a.title||'')+'</span></span>'
     +'<span class="live-dot" style="background:#fff;flex:none"></span>'
     +'<span style="font-family:var(--mono);font-size:11.5px;white-space:nowrap">যুক্ত হোন →</span>';
    /* ⭐ সরাসরি onclick — ক্লিক-হ্যান্ডলার-নির্ভরতা শূন্য! (মোবাইল-নিশ্চিত!) */
    b.onclick=function(ev){
      try{ ev.preventDefault(); ev.stopPropagation();
        apAnnWatchDirect({pid:a.pid||'',name:a.name||'',title:a.title||''});
      }catch(e){}
    };
    document.body.appendChild(b);
    document.body.style.paddingTop='50px';
    apAnnBar=b;
  }catch(e){}
}
try{ apAnnShow=function(a){ try{ apAnnBarMake(a); }catch(e){} }; }catch(e){}
try{ apLiveBannerShow=function(a){ try{ apAnnBarMake(a); }catch(e){} }; }catch(e){}

/* ---- পর্দা-২: সরাসরি-দর্শক (v5.7-র Firebase-পথ ব্যবহার করে) ---- */
function apAnnWatchDirect(ann){
  try{
    if(!me()) return openAuth('login');
    if(apLive&&apLive.by==='me'){ try{renderLiveRoom();}catch(e){} return; }
    apLive={id:ann.pid||('live'+Date.now()),host:ann.name||'লাইভ',title:ann.title||'লাইভ',topic:'story',by:'viewer',stream:null,viewers:1};
    view='liveRoom';
    const V=document.getElementById('view');
    if(!V) return;
    V.innerHTML='<button class="backb" data-act="backFeed">← '+esc(t('all_f'))+'</button>'
     +'<div class="live-hero"><div class="live-grid"><div class="live-player">'
     +'<div class="lv-top"><span class="live-badge"><span class="live-dot"></span>LIVE</span><span class="lv-views" id="lvViews">👁 …</span></div>'
     +'<video id="lvVid" autoplay playsinline style="background:#000"></video>'
     +'<div class="lv-cap"><b>'+esc(apLive.title||'')+'</b> · 👤 '+esc(apLive.host||'')+'</div></div>'
     +'<div class="live-chat"><div class="lc-h">💬 লাইভ চ্যাট</div><div class="lc-log" id="lvChatLog"></div>'
     +'<div class="lc-form"><input id="lvChatIn" maxlength="140" placeholder="মেসেজ লেখো…"><button class="c-send" data-act="liveChatSend">➤</button></div></div></div>'
     +'<div class="lv-rep" id="apVSt">📡 সংযোগের চেষ্টা চলছে… (সর্বোচ্চ ৩০ সেকেন্ড)</div></div>';
    try{renderHeader();}catch(e){}
    window.scrollTo(0,0);
    apWatchRealFb(ann.pid);
  }catch(e){ console.warn('v58-direct',e); toast('⚠️ ঢোকা গেল না — আবার চাপো','alert'); }
}

/* ---- পর্দা-৩: Firebase-সিগন্যাল দর্শক (নিজস্ব — পুরনো ফাংশন সম্পূর্ণ বাইপাস!) ---- */
var apFbPc=null, apFbUnsub=null;
function apWatchRealFb(liveId){
  try{
    apFbClean();
    let tries=0;
    const tryConn=async()=>{
      try{
        if(!apLive||apLive.by!=='viewer') return;
        const sig=await apRtcLogGet(liveId);
        if(!sig||!sig.offer||!sig.hostOn){
          tries++;
          const st=document.getElementById('apVSt');
          if(st&&tries<12) st.textContent='📡 হোস্টের পথ খুলছে… ('+tries+'/১২)';
          if(tries>=12){ toast('📵 হোস্ট লাইভ বন্ধ করেছে বা পথ বন্ধ','alert'); return; }
          setTimeout(tryConn,2500); return;
        }
        if(!window.RTCPeerConnection){ toast('⚠️ স্ট্রিম সাপোর্ট নেই','alert'); return; }
        if(apFbPc){ try{apFbPc.close();}catch(e){} }
        const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});
        apFbPc=pc;
        try{ pc.addTransceiver('video',{direction:'recvonly'}); pc.addTransceiver('audio',{direction:'recvonly'}); }catch(e){}
        const vc=[];
        pc.onicecandidate=e=>{ if(e.candidate){ vc.push(e.candidate.toJSON());
          try{ if(apFBReady&&typeof firebase!=='undefined'){ FBDB.collection('aliveSignals').doc(liveId).set({vCands:vc.slice()},{merge:true}).catch(()=>{}); } }catch(e){} } };
        pc.ontrack=e=>{
          try{
            const remote=e.streams&&e.streams[0];
            const v=document.getElementById('lvVid');
            if(v&&remote){ v.srcObject=remote; v.muted=false; v.volume=1;
              v.play().then(()=>{ toast('🔴 সংযুক্ত! দেখছো ও শুনছো 🎧','globe');
                const st2=document.getElementById('apVSt'); if(st2) st2.style.display='none';
              }).catch(()=>{ toast('🔊 শব্দ-চালু করতে ভিডিওতে একবার চাপ দাও','vid'); });
              v.onclick=()=>{ try{ v.muted=false; v.play(); }catch(e){} };
            }
          }catch(e){}
        };
        pc.onconnectionstatechange=()=>{ try{
          if(pc.connectionState==='connected'){ toast('🔴 সরাসরি সংযুক্ত! 🎧','globe'); }
          if(['failed','disconnected'].includes(pc.connectionState)){ const st3=document.getElementById('apVSt'); if(st3) st3.textContent='⚠️ সংযোগ বিচ্ছিন্ন — বেরিয়ে আবার ঢুকো'; }
        }catch(e){} };
        await pc.setRemoteDescription(new RTCSessionDescription(sig.offer));
        const ans=await pc.createAnswer(); await pc.setLocalDescription(ans);
        if(apFBReady&&typeof firebase!=='undefined'){
          FBDB.collection('aliveSignals').doc(liveId).set({answer:{type:ans.type,sdp:ans.sdp},vCands:vc.slice()},{merge:true}).catch(()=>{});
        }
      }catch(e){ console.warn('fbwatch',e); }
    };
    tryConn();
  }catch(e){ console.warn('v58-fb',e); }
}
function apFbClean(){ try{
  if(apFbPc){ try{apFbPc.close();}catch(e){} apFbPc=null; }
  if(apFbUnsub){ try{apFbUnsub();}catch(e){} apFbUnsub=null; }
}catch(e){} }

/* ---- পর্দা-৪: হোস্ট (v5.7-র Firebase-পথ ধরে রাখা + পথ-নিবন্ধন-নিশ্চিত) ---- */
try{ apBroadStart=async function(stream){
  try{
    if(!apLive||!stream||!window.RTCPeerConnection) return;
    if(apRTCPc){ try{apRTCPc.close();}catch(e){} }
    const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});
    apRTCPc=pc;
    stream.getTracks().forEach(t=>{ try{ pc.addTrack(t,stream); }catch(e){} });
    const hc=[];
    pc.onicecandidate=e=>{ if(e.candidate){ hc.push(e.candidate.toJSON());
      try{ apRtcLogSet({hCands:hc.slice()}); }catch(e){} } };
    apRtcLogSet({hostOn:true,ts:Date.now()});
    const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
    apRtcLogSet({offer:{type:offer.type,sdp:offer.sdp}});
    apRtcListen(apLive.id,async d=>{
      try{
        if(d&&d.answer&&!pc.remoteDescription){ await pc.setRemoteDescription(new RTCSessionDescription(d.answer)); }
        if(d&&d.vCands&&d.vCands.length){ d.vCands.forEach(c=>{ try{ pc.addIceCandidate(new RTCIceCandidate(c)); }catch(e){} }); }
      }catch(e){}
    });
    pc.onconnectionstatechange=()=>{ try{
      if(pc.connectionState==='connected'&&apLive){
        apLive.viewers=(apLive.viewers||0)+1;
        const v=document.getElementById('lvViews'); if(v) v.textContent='👁 '+fmt(apLive.viewers);
        toast('📺 একজন দর্শক সংযুক্ত!','users');
      }
    }catch(e){} };
    toast('📡 সম্প্রচার-পথ খোলা — দর্শকরা যুক্ত হতে পারবে!','globe');
  }catch(e){ console.warn('broad58',e); }
}; }catch(e){}

/* ---- পর্দা-৫: পুরনো ভুল-পথ বন্ধ (PeerJS liveWatch বহিষ্কার!) ---- */
try{ liveWatch=function(id){
  try{
    (async()=>{
      let info=null;
      if(apFBReady&&typeof firebase!=='undefined'){
        try{ const d=await FBDB.collection('alivenow').doc(id).get();
          if(d.exists) info=Object.assign({id:id},d.data());
        }catch(e){}
      }
      if(!info){ const L=(S.lives||[]).find(x=>x.id===id); if(L) info=Object.assign({id:id},L); }
      if(!info){ toast('এই লাইভটা আর চালু নেই','alert'); try{renderLiveHome();}catch(e){} return; }
      if(apLive&&apLive.by==='me'){ toast('এখন তুমি নিজেই লাইভে — আগে এটা শেষ করো','alert'); return; }
      apLive={id:id,host:info.host||'লাইভ',title:info.title||'লাইভ',by:'viewer',stream:null,viewers:1};
      view='liveRoom';
      apAnnWatchDirect.call(null,{pid:id,name:info.host,title:info.title});
    })();
  }catch(e){}
}; }catch(e){}

/* দর্শক-পরিষ্কার */
try{ const o=endLive; endLive=function(){
  try{ if(apLive&&apLive.by==='viewer'){ apFbClean(); apLive=null; return; } }catch(e){}
  return o.apply(this,arguments);
}; }catch(e){}

console.log('🎧 v5.8 ready — PeerJS-সম্পূর্ণ-বহিষ্কার · মোবাইল-দণ্ড-ক্লিক-নিশ্চিত · Firebase-সিগন্যাল');
/* ═══════════ END v5.8 ═══════════ */

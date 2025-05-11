const tmi = require('tmi.js');
const axios = require('axios');

// === CONFIGURATION ===
const username = 'killa8boll'; // Bot's Twitch username
const clientId = 'b90ljf01uomjl8muc9ul8sq6kddeg6'; // Twitch Developer App Client ID
const clientSecret = 'mpyx2jm95qw91l5c8emvlkqf6h2h6r'; // Twitch Developer App Secret
const channel = 'olvtorenstream'; // Channel to join

let accessToken = 'gh9bzjah46499odi074yh552oip4j6';
let refreshToken = '7cagt0uoad3zli0dj8cofin5qio2jx3unawld86je065djz198';

// === MAIN CHAT BOT ===
async function startBot() {
    console.log("[BOT] Starting...");

    const client = new tmi.Client({
        identity: {
            username,
            password: `oauth:${accessToken}`
        },
        channels: [channel]
    });

    try {
        await client.connect();
        console.log(`[BOT] Connected to ${channel} as ${username}`);
    } catch (error) {
        console.error('[BOT] Failed to connect:', error);
        return;
    }

    // Listen for chat messages
    client.on('message', async (channel, tags, message, self) => {
        if (self) return;

        if (message.toLowerCase() === '!period') {
            const username = tags.username;
            const followDate = await getFollowDate(username);
            if (followDate) {
                const duration = calculateFollowDuration(followDate);
                client.say(channel, `@${username}, you've been following for ${duration}`);
            } else {
                client.say(channel, `@${username}, I couldn't find your follow date.`);
            }
        }
    });
}

// === UTILITY: Get User Follow Date ===
async function getFollowDate(fromUserLogin) {
    console.log(`[API] Checking follow date for ${fromUserLogin}`);

    // Step 1: Get user IDs
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': clientId
        },
        params: {
            login: fromUserLogin
        }
    });

    const fromUserId = userResponse.data.data[0]?.id;
    if (!fromUserId) {
        console.error("[API] User not found");
        return null;
    }

    // Step 2: Get target channel ID
    const toUserResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': clientId
        },
        params: {
            login: channel
        }
    });

    const toUserId = toUserResponse.data.data[0]?.id;
    if (!toUserId) {
        console.error("[API] Channel user not found");
        return null;
    }

    // Step 3: Check follow relationship
    try {
        const followResponse = await axios.get('https://api.twitch.tv/helix/users/follows', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': clientId
            },
            params: {
                from_id: fromUserId,
                to_id: toUserId
            }
        });

        const followData = followResponse.data.data[0];
        return followData?.followed_at || null;
    } catch (error) {
        console.error('[API] Failed to get follow info:', error.response?.data || error.message);
        return null;
    }
}

// === UTILITY: Calculate Duration ===
function calculateFollowDuration(followDate) {
    const followTime = new Date(followDate);
    const now = new Date();
    const diffDays = Math.floor((now - followTime) / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
}

// === START ===
startBot();

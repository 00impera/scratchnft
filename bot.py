import os
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

BOT_TOKEN = os.environ["BOT_TOKEN"]
CONTRACT  = "0x71a8F50008b08cc736E739239faF549a34fD9C8f"
DAPP_URL  = "https://00impera.github.io/scratchnft"
RPC_URL   = "https://rpc.monad.xyz"
CHAIN_ID  = 143
EXPLORER  = "https://monad.socialscan.io"

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def rpc_call(method, params):
    try:
        r = requests.post(RPC_URL, json={"jsonrpc":"2.0","id":1,"method":method,"params":params}, timeout=8)
        return r.json().get("result")
    except: return None

def eth_call(data):
    return rpc_call("eth_call", [{"to": CONTRACT, "data": data}, "latest"])

def decode_uint(h):
    return int(h, 16) if h and h != "0x" else 0

def get_total_supply(): return decode_uint(eth_call("0x18160ddd"))
def get_card_price(): return decode_uint(eth_call("0xa035b1fe")) / 1e18
def get_prize_pool(): return decode_uint(rpc_call("eth_getBalance", [CONTRACT, "latest"])) / 1e18
def get_balance(addr):
    return decode_uint(eth_call("0x70a08231" + addr.lower().replace("0x","").zfill(64)))

def main_kb():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🎰 PLAY NOW", web_app=WebAppInfo(url=DAPP_URL))],
        [InlineKeyboardButton("📊 Stats", callback_data="stats"), InlineKeyboardButton("💰 Price", callback_data="price")],
        [InlineKeyboardButton("🏆 How to Win", callback_data="howtowin"), InlineKeyboardButton("📜 Contract", callback_data="contract")],
        [InlineKeyboardButton("🔗 Explorer", url=f"{EXPLORER}/address/{CONTRACT}"), InlineKeyboardButton("❓ Help", callback_data="help")],
    ])

def back_kb():
    return InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Back", callback_data="back")]])

WELCOME = """✦ *SCRATCHCARD NFT* ✦
━━━━━━━━━━━━━━━━━━━━
🎰 The first on-chain scratch card game on *Monad*!

*How it works:*
1️⃣ Mint a scratch card NFT
2️⃣ Scratch it on-chain
3️⃣ Win up to *20× your bet* in MON!

*Characters:* 🏍️ USDC Rider · ⚔️ ETH Warrior · 🏎️ Monad Racer

*Prizes:* 🥉 2× · 🥈 5× · 🥇 20×
━━━━━━━━━━━━━━━━━━━━
Ready to scratch? 👇"""

async def start(u, c): await u.message.reply_text(WELCOME, parse_mode="Markdown", reply_markup=main_kb())
async def play(u, c):
    await u.message.reply_text("🎰 *Open the dApp!*", parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🎰 Play Now", web_app=WebAppInfo(url=DAPP_URL))]]))

async def stats_cmd(u, c):
    msg = await u.message.reply_text("⏳ Fetching...")
    s,p,pool = get_total_supply(), get_card_price(), get_prize_pool()
    await msg.edit_text(f"📊 *LIVE STATS*\n━━━━━━━━━━━━━━━━━━━━\n🃏 Minted: `{s}`\n💎 Price: `{p:.4f} MON`\n🏦 Prize Pool: `{pool:.4f} MON`", parse_mode="Markdown", reply_markup=main_kb())

async def price_cmd(u, c):
    msg = await u.message.reply_text("⏳ Fetching...")
    p = get_card_price()
    await msg.edit_text(f"💰 *PRICE*\n━━━━━━━━━━━━━━━━━━━━\n🎟️ Mint: `{p:.4f} MON`\n🥉 Small: `{p*2:.4f} MON`\n🥈 Big: `{p*5:.4f} MON`\n🥇 Jackpot: `{p*20:.4f} MON`", parse_mode="Markdown", reply_markup=main_kb())

async def contract_cmd(u, c):
    await u.message.reply_text(f"📜 *CONTRACT*\n`{CONTRACT}`\n\nChain ID: {CHAIN_ID} (Monad)",
        parse_mode="Markdown", reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("🔗 Explorer", url=f"{EXPLORER}/address/{CONTRACT}"),
            InlineKeyboardButton("⬅️ Back", callback_data="back")]]))

async def balance_cmd(u, c):
    if c.args and c.args[0].startswith("0x") and len(c.args[0])==42:
        msg = await u.message.reply_text("⏳ Checking...")
        bal = get_balance(c.args[0])
        await msg.edit_text(f"🃏 Cards owned: *{bal}*", parse_mode="Markdown", reply_markup=back_kb())
    else:
        await u.message.reply_text("Usage: `/balance 0xYourAddress`", parse_mode="Markdown")

async def howtowin_cmd(u, c):
    await u.message.reply_text("🏆 *HOW TO WIN*\n1️⃣ Connect wallet\n2️⃣ Mint a card\n3️⃣ Scratch on-chain\n4️⃣ Claim prize!\n\n🥇 Jackpot = 20×\n🥈 Big = 5×\n🥉 Small = 2×", parse_mode="Markdown", reply_markup=back_kb())

async def help_cmd(u, c):
    await u.message.reply_text("❓ *COMMANDS*\n/start /play /stats /price /contract /balance /howtowin /help\n\nNetwork: Monad (Chain 143)\nRPC: rpc.monad.xyz", parse_mode="Markdown", reply_markup=main_kb())

async def button(u, c):
    q = u.callback_query; await q.answer(); d = q.data
    if d=="back": await q.edit_message_text(WELCOME, parse_mode="Markdown", reply_markup=main_kb())
    elif d=="stats":
        s,p,pool = get_total_supply(), get_card_price(), get_prize_pool()
        await q.edit_message_text(f"📊 *LIVE STATS*\n🃏 Minted: `{s}`\n💎 Price: `{p:.4f} MON`\n🏦 Pool: `{pool:.4f} MON`", parse_mode="Markdown", reply_markup=main_kb())
    elif d=="price":
        p = get_card_price()
        await q.edit_message_text(f"💰 *PRICE*\n🎟️ `{p:.4f} MON`\n🥉 `{p*2:.4f}` 🥈 `{p*5:.4f}` 🥇 `{p*20:.4f}`", parse_mode="Markdown", reply_markup=main_kb())
    elif d=="howtowin": await q.edit_message_text("🏆 Mint → Scratch → Win!\n\n🥇 20× 🥈 5× 🥉 2×", parse_mode="Markdown", reply_markup=back_kb())
    elif d=="contract": await q.edit_message_text(f"📜 `{CONTRACT}`\nChain: {CHAIN_ID}", parse_mode="Markdown", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔗 Explorer", url=f"{EXPLORER}/address/{CONTRACT}"), InlineKeyboardButton("⬅️ Back", callback_data="back")]]))
    elif d=="help": await q.edit_message_text("❓ /start /play /stats /price /contract /balance /help", parse_mode="Markdown", reply_markup=main_kb())

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    for cmd, fn in [("start",start),("play",play),("stats",stats_cmd),("price",price_cmd),("contract",contract_cmd),("balance",balance_cmd),("howtowin",howtowin_cmd),("help",help_cmd)]:
        app.add_handler(CommandHandler(cmd, fn))
    app.add_handler(CallbackQueryHandler(button))
    log.info("✦ ScratchCard Bot started ✦")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__": main()

"""Generate generic (unbranded) Android-style sample screens for the demo gallery.

usage: python scripts/make_samples.py ../frontend/public/samples
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
W, H = 540, 1170
INK, SUB, LINE, BLUE = (28, 27, 31), (98, 98, 110), (226, 228, 234), (26, 115, 232)


def F(s, b=False):
    return ImageFont.truetype(BOLD if b else FONT, s)


def base(bg=(250, 250, 252)):
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    d.text((28, 16), "9:41", fill=INK, font=F(22, True))
    d.text((452, 16), "100%", fill=INK, font=F(20))
    return im, d


def navbar(d, items, active):
    d.rectangle((0, H - 110, W, H), fill=(243, 244, 248))
    n = len(items)
    for i, t in enumerate(items):
        cx = int((i + 0.5) * W / n)
        if i == active:
            d.rounded_rectangle((cx - 34, H - 96, cx + 34, H - 64), 16, fill=(214, 227, 255))
        d.ellipse((cx - 9, H - 89, cx + 9, H - 71), outline=INK, width=2)
        tw = d.textlength(t, font=F(20))
        d.text((cx - tw / 2, H - 54), t, fill=INK if i == active else SUB, font=F(20, i == active))


def clock():
    im, d = base()
    d.text((28, 84), "Alarm", fill=INK, font=F(44))
    for i, (t, lbl, on) in enumerate([("6:30", "Gym · Mon, Wed, Fri", True), ("7:15", "Weekdays", True), ("9:00", "Weekend", False), ("22:30", "Wind down", True)]):
        y = 170 + i * 170
        d.rounded_rectangle((20, y, W - 20, y + 150), 28, fill=(238, 241, 250))
        d.text((48, y + 20), t, fill=INK if on else SUB, font=F(60))
        d.text((50, y + 104), lbl, fill=SUB, font=F(22))
        x = W - 120
        d.rounded_rectangle((x, y + 50, x + 76, y + 92), 21, fill=BLUE if on else (200, 202, 210))
        cx = x + 55 if on else x + 21
        d.ellipse((cx - 15, y + 56, cx + 15, y + 86), fill="white")
    d.rounded_rectangle((W - 140, H - 260, W - 36, H - 156), 28, fill=(214, 227, 255))
    d.text((W - 103, H - 246), "+", fill=INK, font=F(64))
    navbar(d, ["Alarm", "Clock", "Timer", "Stopwatch"], 0)
    return im


def settings():
    im, d = base()
    d.text((28, 84), "Settings", fill=INK, font=F(44))
    d.rounded_rectangle((20, 160, W - 20, 222), 31, fill=(236, 238, 244))
    d.text((70, 176), "Search settings", fill=SUB, font=F(24))
    rows = [("Network & internet", "Wi-Fi, mobile, data usage"), ("Connected devices", "Bluetooth, pairing"), ("Apps", "Recent apps, default apps"),
            ("Notifications", "Notification history"), ("Battery", "85% · About 1 day left"), ("Display", "Dark theme, font size"),
            ("Sound & vibration", "Volume, haptics"), ("Security & privacy", "Screen lock, app security")]
    cols = [(66, 133, 244), (52, 168, 83), (251, 140, 0), (156, 39, 176), (0, 150, 136), (255, 179, 0), (233, 30, 99), (96, 125, 139)]
    for i, ((t, s), c) in enumerate(zip(rows, cols)):
        y = 250 + i * 98
        d.ellipse((34, y + 14, 82, y + 62), fill=c)
        d.text((108, y + 8), t, fill=INK, font=F(27))
        d.text((108, y + 46), s, fill=SUB, font=F(21))
    return im


def mail():
    im, d = base((255, 255, 255))
    d.rounded_rectangle((20, 66, W - 20, 132), 33, fill=(237, 241, 248))
    d.text((84, 84), "Search in mail", fill=SUB, font=F(25))
    d.ellipse((W - 74, 76, W - 30, 120), fill=(126, 87, 194))
    d.text((W - 60, 84), "A", fill="white", font=F(24, True))
    d.text((28, 152), "Primary", fill=SUB, font=F(21))
    items = [("Priya Sharma", "Project kickoff notes", "Here is the agenda for Monday…", "10:24", (229, 115, 115)),
             ("Travel Desk", "Your trip is confirmed", "Booking ref QX7-221 for 14 Nov…", "9:02", (77, 182, 172)),
             ("Leo Martin", "Re: Draft slides", "Looks great, two small edits on…", "Yesterday", (121, 134, 203)),
             ("Campus Library", "Book due in 3 days", "Please return or renew your…", "Yesterday", (255, 183, 77)),
             ("Mina Chen", "Dinner on Friday?", "Thinking the new place near…", "Oct 28", (186, 104, 200)),
             ("Weekly Digest", "5 articles picked for you", "Generative models for GUI…", "Oct 27", (100, 181, 246))]
    for i, (n, sub, prev, t, c) in enumerate(items):
        y = 192 + i * 128
        d.ellipse((24, y + 16, 80, y + 72), fill=c)
        d.text((40, y + 26), n[0], fill="white", font=F(28, True))
        bold = i < 2
        d.text((100, y + 10), n, fill=INK, font=F(25, bold))
        d.text((W - 28 - d.textlength(t, font=F(20)), y + 14), t, fill=INK if bold else SUB, font=F(20, bold))
        d.text((100, y + 46), sub, fill=INK if bold else SUB, font=F(22, bold))
        d.text((100, y + 80), prev, fill=SUB, font=F(21))
    d.rounded_rectangle((W - 200, H - 250, W - 30, H - 160), 26, fill=(194, 231, 255))
    d.text((W - 150, H - 222), "Compose", fill=INK, font=F(24, True))
    navbar(d, ["Mail", "Meet"], 0)
    return im


def shop():
    im, d = base((255, 255, 255))
    d.text((28, 72), "‹", fill=INK, font=F(44))
    d.text((W - 70, 78), "♡", fill=INK, font=F(34))
    d.rounded_rectangle((20, 140, W - 20, 560), 24, fill=(241, 243, 247))
    d.rounded_rectangle((120, 260, 420, 420), 60, fill=(48, 63, 159))
    d.rounded_rectangle((150, 400, 430, 450), 20, fill=(236, 239, 241))
    d.text((28, 590), "TrailRun Pro Running Shoes", fill=INK, font=F(26, True))
    d.text((28, 634), "★★★★☆  4.3 · 1,284 reviews", fill=SUB, font=F(22))
    d.text((28, 684), "$79.99", fill=INK, font=F(40, True))
    d.text((200, 698), "20% off", fill=(46, 125, 50), font=F(24, True))
    d.text((28, 760), "Size", fill=INK, font=F(24, True))
    for i, s in enumerate(["7", "8", "9", "10", "11"]):
        x = 28 + i * 98
        d.rounded_rectangle((x, 800, x + 82, 860), 14, outline=BLUE if s == "9" else LINE, width=3 if s == "9" else 2)
        d.text((x + 41 - d.textlength(s, font=F(24)) / 2, 815), s, fill=INK, font=F(24))
    d.text((28, 890), "Free delivery by Tue, 4 Nov", fill=(46, 125, 50), font=F(22))
    d.rounded_rectangle((20, H - 140, 262, H - 60), 40, outline=BLUE, width=3)
    d.text((70, H - 116), "Add to cart", fill=BLUE, font=F(25, True))
    d.rounded_rectangle((278, H - 140, W - 20, H - 60), 40, fill=BLUE)
    d.text((345, H - 116), "Buy now", fill="white", font=F(25, True))
    return im


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "samples")
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in [("clock", clock), ("settings", settings), ("mail", mail), ("shop", shop)]:
        fn().save(out / f"{name}.png", optimize=True)
        print("wrote", out / f"{name}.png")

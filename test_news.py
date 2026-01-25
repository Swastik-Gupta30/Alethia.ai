
import yfinance as yf
import json

try:
    ticker = yf.Ticker("GLOBAL")
    news = ticker.news
    print(json.dumps(news, indent=2))
except Exception as e:
    print(e)

base = 100.0
FEE_P = 0.20 # %
FEE_C = 1.0 - (FEE_P / 100)

BTCEUR = 2436.0007
ETHBTC = 0.13888001
ETHEUR = 341.999999

XRPJPY = 29.9752
XRPBTC = 0.00010245
BTCJPY =

puts "ARBITRAGE: Buy BTC with EUR at #{BTCEUR}, then buy ETH with BTC at #{ETHBTC}, then sell ETH for EUR at #{ETHEUR}"

puts "Starting with #{base} EUR"

trade_1 = base * (1.0 / ETHEUR) * FEE_C

puts "buying the ETH with EUR gives you #{trade_1} BTC."

trade_2 = trade_1 * ETHBTC * FEE_C

puts "selling the ETH for BTC gives you #{trade_2} BTC."

trade_3 = trade_2 * BTCEUR * FEE_C

puts "selling the BTC for EUR gives you #{trade_3} EUR."

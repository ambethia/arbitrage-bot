base = 100.0
FEE_P = 0.20 # %
FEE_C = 1.0 - (FEE_P / 100)

# buy ETH with EUR at 349.4999, then sell ETH for BTC at 0.14037901, then sell BTC for EUR at 2453.5413

puts "Start with #{base} EUR"

trade_1 = base / 349.4999 # * FEE_C

# trade_1 = base * 

puts "buying the ETH with EUR gives you #{trade_1} ETH."

trade_2 = trade_1 * 0.14037901 # * FEE_C

puts "selling the ETH for BTC gives you #{trade_2} BTC."

trade_3 = trade_2 * 2453.5413 # * FEE_C

puts "selling the BTC for EUR gives you #{trade_3} EUR."

puts 2469.3569 * 0.14130544 * 0.0029325461538089468
puts (1 / 2469.3569) * (1 / 0.14130544) * (1 / 0.0029325461538089468)
#!/usr/bin/ruby
TRANSACTION_COST = 0.2

# Initialize graph from curreny exchange rates
rates = {}
graph = {}

STDIN.read.split("\n").each do |line|
  c_1, r, c_2 = line.split(' ')

  r = r.to_f * (1.0 - TRANSACTION_COST / 100)
  w = Math.log10(r)

  graph[c_1] ||= {}
  graph[c_1][c_2] = -1.0 * w

  rates[c_1] ||= {}
  rates[c_1][c_2] = r
end

# Add a dummy root node
root = 'Root'
graph[root] = {}
graph.each_key { |v| graph[root][v] = 0.0 }

# Initialize distances and predecessors
dist = {}
pred = {}
graph.each_key { |v| dist[v] = Float::MAX }
dist[root] = 0

# Relax every edge n - 1 times
(graph.keys.size - 1).times do
  graph.each do |v_1, e|
    e.each do |v_2, w|
      if dist[v_2] > dist[v_1] + w
        dist[v_2] = dist[v_1] + w
        pred[v_2] = v_1
      end
    end
  end
end


# Relax every edge again to find negative-weight cycles
arbitrage = false
cyclic = {}
graph.each do |v_1, e|
  e.each do |v_2, w|
    if dist[v_2] > dist[v_1] + w
      arbitrage = true
      dist[v_2] = dist[v_1] + w

      # Keep track of vertices in negative-weight cycles
      cyclic[v_2] = true
    end
  end
end

if !arbitrage
  puts "No arbitrage found."
  exit
end

# Calculate the arbitrage sequences
sequences = []
cyclic.each_key do |v|
  # Recursively visit predecessors to trace vertices in cycle
  visited = {v => true}
  seq = []
  p = v
  begin
    seq.push(p)
    visited[p] = true
    p = pred[p]
  end while !p.nil? && !visited[p]
  seq.reverse!.push(seq.first)

  # Calculate the arbitrage amount
  val = (0..seq.size - 2).inject(1.0) do |v, i|
    rate = rates[seq[i]][seq[i+1]]
    if !rate
      0
    else
      v * rate
    end
  end
  sequences.push({:currencies => seq, :value => val})
end


# Output the sequences in descending order of value
puts "Arbitrage sequences:"
sequences.sort! { |a, b| b[:value] <=> a[:value] }
sequences.each do |s|
  break if s[:value] <= 1.0
  puts ("%.14f " % s[:value].to_s) + s[:currencies].inspect.to_s
end

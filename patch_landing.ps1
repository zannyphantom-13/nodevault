$f = "c:\Users\Hassan\Desktop\the scheme\src\pages\Landing.jsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

# 1. After heroVisible state, add liveStats state
$c = $c.Replace(
    "  const [heroVisible, setHeroVisible] = useState(false);",
    "  const [heroVisible, setHeroVisible] = useState(false);`r`n  const [liveStats, setLiveStats] = useState(null);"
)

# 2. Add live stats useEffect after the heroVisible one
$c = $c.Replace(
    "  useEffect(() => {`r`n    const timer = setTimeout(() => setHeroVisible(true), 80);`r`n    return () => clearTimeout(timer);`r`n  }, []);",
    "  useEffect(() => {`r`n    const timer = setTimeout(() => setHeroVisible(true), 80);`r`n    return () => clearTimeout(timer);`r`n  }, []);`r`n`r`n  useEffect(() => {`r`n    const metrics = dbAdmin.getSystemMetrics();`r`n    setLiveStats(metrics);`r`n  }, []);"
)

# 3. Remove: const stats = REGIONS.NG.platformStats;
$c = $c.Replace("  const stats = REGIONS.NG.platformStats;`r`n`r`n  return (", "  return (")

# 4. Hero badge - add ~ prefix and EST. label
$c = $c.Replace(
    [char]0x26 + "zwnj;⚡ DECENTRALIZED YIELD LAUNCHPAD " + [char]0xB7 + " {sovereignRate?.customerAPY || '12.7'}% SOVEREIGN APY",
    [char]0x26 + "zwnj;⚡ DECENTRALIZED YIELD LAUNCHPAD " + [char]0xB7 + " ~{sovereignRate?.customerAPY || '—'}% EST. SOVEREIGN APY"
)
# Simpler approach for hero badge
$c = $c.Replace(
    "⚡ DECENTRALIZED YIELD LAUNCHPAD · {sovereignRate?.customerAPY || '12.7'}% SOVEREIGN APY",
    "⚡ DECENTRALIZED YIELD LAUNCHPAD · ~{sovereignRate?.customerAPY || '—'}% EST. SOVEREIGN APY"
)

# 5. Hero desc APY reference
$c = $c.Replace(
    "Stake once into 15 progressive node tiers, earn <strong>{sovereignRate?.customerAPY || '12.7'}% annual protocol yield</strong>,",
    "Stake once into 15 progressive node tiers, earn <strong>~{sovereignRate?.customerAPY || '—'}% estimated annual protocol yield</strong>,"
)

# 6. Trust row - replace the backtick template literal line
# We target the whole array content line by line
$old6 = "                `${sovereignRate?.customerAPY || '12.7'}% CBN 364D T-Bill Benchmark`,"
$new6 = "                `~${sovereignRate?.customerAPY || '—'}% Est. Sovereign APY (CBN 364D)`,"
$c = $c.Replace($old6, $new6)

# 7. Stats bar - Active Network Nodes
$c = $c.Replace(
    "            { label: 'Active Network Nodes', color: 'var(--accent-cyan)', el: <Counter end={stats.totalNodes} /> },",
    "            { label: 'Active Network Nodes', color: 'var(--accent-cyan)', el: <Counter end={liveStats?.totalUsers || 0} /> },"
)

# 8. Stats bar - Total Value Staked
$c = $c.Replace(
    "            { label: 'Total Value Staked',   color: 'var(--accent-cyan)', el: <>₦<Counter end={4820} suffix=""M+"" /></> },",
    "            { label: 'Total Value Staked',   color: 'var(--accent-cyan)', el: <>{liveStats?.totalStaked ? formatNairaCompact(liveStats.totalStaked) : '₦0'}</> },"
)

# 9. Stats bar - Genesis Pools Live
$c = $c.Replace(
    "            { label: 'Genesis Pools Live',   color: 'var(--accent-indigo)', el: <Counter end={stats.activePools} /> },",
    "            { label: 'Genesis Pools Live',   color: 'var(--accent-indigo)', el: <Counter end={liveStats?.activeTiers || 0} /> },"
)

# 10. Stats bar - Sovereign APY label + value
$c = $c.Replace(
    "            { label: 'Sovereign APY',        color: 'var(--accent-green)', el: <>{sovereignRate?.customerAPY || '12.7'}%</> },",
    "            { label: 'Est. Sovereign APY',   color: 'var(--accent-green)', el: <>~{sovereignRate?.customerAPY || '—'}%</> },"
)

# 11. Stats bar - Active Validators
$c = $c.Replace(
    "            { label: 'Active Validators',    color: '#fff', el: <Counter end={stats.activeValidators || 18742} /> },",
    "            { label: 'Active Validators',    color: '#fff', el: <Counter end={liveStats?.totalUsers || 0} /> },"
)

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
$size = (Get-Item $f).Length
Write-Host "Written: $size bytes"

# Verify key replacements
$verify = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
if ($verify -match "liveStats") { Write-Host "✓ liveStats present" } else { Write-Host "✗ liveStats MISSING" }
if ($verify -notmatch "stats\.totalNodes") { Write-Host "✓ No hardcoded totalNodes" } else { Write-Host "✗ totalNodes still present" }
if ($verify -notmatch "18742") { Write-Host "✓ No hardcoded 18742" } else { Write-Host "✗ 18742 still present" }
if ($verify -notmatch "4820") { Write-Host "✓ No hardcoded 4820" } else { Write-Host "✗ 4820 still present" }
if ($verify -match "EST\. SOVEREIGN APY") { Write-Host "✓ EST. SOVEREIGN APY label present" } else { Write-Host "✗ EST label MISSING" }


export const short = {
  en_US:
    'A minimal Bitcoin Core fork: 60-second blocks and mandatory 137-day pruning. The UTXO set persists; transaction history is mathematically erased after α⁻¹ days.',
  de_DE:
    'Ein minimaler Bitcoin-Core-Fork: 60-Sekunden-Blöcke und verpflichtendes 137-Tage-Pruning. Das UTXO-Set bleibt; die Transaktionshistorie wird nach α⁻¹ Tagen mathematisch gelöscht.',
}

export const long = {
  en_US:
    "Elektron Net is a minimal, focused fork of Bitcoin Core. It preserves Bitcoin's SHA-256d proof-of-work consensus, the 21,000,000 supply cap, the four-year halving rhythm, and the entire P2P, script, and wallet stack. Two deliberate protocol changes are introduced. First, block times are reduced from 10 minutes to 60 seconds — faster confirmation latency without altering the economic model. Second, every node prunes block files older than 137 days (α⁻¹) regardless of disk size; transaction history before the window is not retained anywhere on the network. The UTXO set — your current balance — is the only permanent data structure. Every block carries an on-chain UTXO attestation (37 bytes in coinbase OP_RETURN); full snapshot files are written at every 137-day checkpoint. A 'Stoic Awakening' chain-liveness mechanism prevents stalls after hashrate shocks. A seed phrase plus a UTXO scan is sufficient to recover spendable balance — but transaction history older than 137 days cannot be reconstructed from the network, by design. The currency unit is Elektron (symbol ELEK; 1 ELEK = 10⁸ leptons). Named after the Lydian Elektron, struck in Asia Minor around 600 BC — the first decentralised currency in history — and grounded in Stoic philosophy: secure what you can control, let go of what you cannot.",
  de_DE:
    'Elektron Net ist ein minimaler, fokussierter Fork von Bitcoin Core. Erhalten bleiben Bitcoins SHA-256d Proof-of-Work, die 21.000.000-Mengenobergrenze, der Vier-Jahres-Halving-Rhythmus sowie der gesamte P2P-, Script- und Wallet-Stack. Zwei bewusste Protokolländerungen: Erstens werden die Blockzeiten von 10 Minuten auf 60 Sekunden verkürzt — schnellere Bestätigung ohne Eingriff in das Wirtschaftsmodell. Zweitens prunt jede Node Blockdateien, die älter als 137 Tage (α⁻¹) sind, unabhängig von der Festplattengröße; Transaktionshistorie vor diesem Zeitfenster wird im gesamten Netzwerk nicht aufbewahrt. Das UTXO-Set — dein aktueller Kontostand — ist die einzige dauerhafte Datenstruktur. Jeder Block trägt ein On-Chain UTXO-Attestat (37 Bytes im Coinbase-OP_RETURN); vollständige Snapshot-Dateien werden an jedem 137-Tage-Checkpoint geschrieben. Ein „Stoic Awakening"-Mechanismus verhindert Chain-Stillstände nach Hashrate-Schocks. Eine Seed-Phrase plus UTXO-Scan reicht aus, um verfügbares Guthaben wiederherzustellen — die Transaktionshistorie älter als 137 Tage ist jedoch by-design nicht aus dem Netz rekonstruierbar. Die Währungseinheit ist Elektron (Symbol ELEK; 1 ELEK = 10⁸ Lepton). Benannt nach der lydischen Elektron-Münze, geprägt in Kleinasien um 600 v. Chr. — der ersten dezentralen Währung der Geschichte — und geprägt von stoischer Philosophie: Sichere, was du kontrollieren kannst, lass los, was du nicht kontrollieren kannst.',
}

export const alertUninstall = {
  en_US:
    "Uninstalling Elektron Net will result in permanent loss of data. Without a backup, any funds stored on your node's default hot wallet will be lost forever. Note: transaction history older than 137 days is by design unavailable on the network — seed + UTXO scan is sufficient to recover spendable balance, but past tx detail is not recoverable. If you are unsure, make a backup first.",
  de_DE:
    'Die Deinstallation von Elektron Net führt zum dauerhaften Verlust von Daten. Ohne ein Backup gehen alle Gelder, die in der Standard-Hot-Wallet Ihres Knotens gespeichert sind, für immer verloren. Hinweis: Transaktionshistorie älter als 137 Tage ist by-design im Netz nicht mehr verfügbar — Seed + UTXO-Scan reicht aus, um das verfügbare Guthaben wiederherzustellen, aber vergangene Transaktionsdetails sind nicht rekonstruierbar. Im Zweifelsfall vorher ein Backup erstellen.',
}

export const torDescription = {
  en_US:
    'Required for .onion peer connectivity, onlynet=onion, or when a Tor address is requested.',
  de_DE:
    'Erforderlich für .onion Peer-Konnektivität, onlynet=onion oder wenn eine Tor-Adresse angefordert wird.',
}

export const alertRestore = {
  en_US:
    'Restoring Elektron Net will overwrite its current data. You will lose any transactions recorded in watch-only wallets, and any funds you have received to the hot wallet, since the last backup. Note: transaction history older than 137 days from the current tip cannot be re-fetched from the network — only the current UTXO set and the trailing 137-day window are available.',
  de_DE:
    'Das Wiederherstellen von Elektron Net überschreibt die aktuellen Daten. Sie verlieren alle Transaktionen, die in Watch-Only-Wallets aufgezeichnet wurden, sowie alle Gelder, die Sie seit dem letzten Backup in der Hot-Wallet erhalten haben. Hinweis: Transaktionshistorie älter als 137 Tage ab dem aktuellen Chain-Tip kann nicht aus dem Netz nachgeladen werden — nur das aktuelle UTXO-Set und das laufende 137-Tage-Fenster sind verfügbar.',
}

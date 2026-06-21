# Elektron Net StartOS – Release erstellen

Gedankenstütze für den Release-Prozess via GitHub Actions.

---

## Voraussetzungen

- `.github/workflows/build.yml` ist im Repo
- Version in `startos/manifest/index.ts` ist gepflegt
- (Optional) `DEV_KEY`-Secret im Repo gesetzt — sonst generiert der
  Workflow für jeden Build einen Wegwerf-Signing-Key

---

## Versionsnummer prüfen / setzen

In `startos/manifest/index.ts` die Versionsnummer im Manifest aktuell halten
(z. B. `version: '0.1.0'` falls explizit gesetzt) sowie ggf. den
`buildArgs.VERSION` der Docker-Builds an die Upstream-Version von Elektron
Net anpassen.

---

## Release erstellen – mit GitHub Desktop

### Schritt 1 – Commit in GitHub Desktop

1. GitHub Desktop öffnen
2. Links alle geänderten Dateien prüfen (Haken setzen)
3. Unten links:
   - **Summary:** z.B. `Release v0.1.0`
   - Button **"Commit to main"** klicken

### Schritt 2 – Push in GitHub Desktop

- Oben rechts **"Push origin"** klicken

### Schritt 3 – Tag setzen via Git Bash

In GitHub Desktop: Menü **Repository → Open in Git Bash**

```bash
git tag v0.1.0
git push origin v0.1.0
```

Wenn es mal fehlschlägt — Tag löschen und neu setzen:

```bash
git tag -d v0.1.0 && git push origin :v0.1.0 && git tag v0.1.0 && git push origin v0.1.0
```

> ⚠️ Tag-Name muss mit `v` beginnen, sonst startet der Workflow nicht!

### Schritt 4 – Build verfolgen

Auf `github.com/Kutlusoy/elektron-net-startos`:
- Tab **"Actions"** → laufenden Workflow beobachten
- Dauer: ~5 Min. (mit Cache) / länger beim ersten Build

### Schritt 5 – Release prüfen

- Tab **"Releases"** → `Elektron Net StartOS Release v0.1.0`
- `elektrond.s9pk` steht als Download-Asset bereit (x86_64 + aarch64)

---

## Release erstellen – nur mit Git (Command Line)

```bash
# 1. Dateien stagen und committen
git add .
git commit -m "Release v0.1.0"

# 2. Push zu GitHub
git push origin main

# 3. Tag setzen und pushen
git tag v0.1.0
git push origin v0.1.0
```

Oder Schritt 2 und 3 kombiniert:
```bash
git push origin main --tags
```

---

## Schnellreferenz

| Aktion | GitHub Desktop | Git Bash |
|---|---|---|
| Dateien committen | ✅ | `git commit -m "..."` |
| Push zu main | ✅ | `git push origin main` |
| Tag erstellen | ❌ nicht möglich | `git tag v0.1.0` |
| Tag pushen | ❌ nicht möglich | `git push origin v0.1.0` |

---

## Sideload auf StartOS

1. Im Release das `elektrond.s9pk` herunterladen
2. StartOS UI → **System → Sideload Service** → Datei hochladen → **Install**

---

## Troubleshooting

**Workflow startet nicht:**
- Tag beginnt nicht mit `v` → `git tag v0.1.0` (nicht `0.1.0`)
- Tag wurde nicht gepusht → `git push origin v0.1.0`

**Build schlägt fehl bei `Install start-cli`:**
- Erreichbarkeit von `start9.com/start-cli/install.sh` prüfen

**Kein `.s9pk` im Release:**
- Unter Actions → den fehlgeschlagenen Job aufklappen
- Step **"Build s9pk"** zeigt Make-Fehler
- Step **"Upload artifact"** zeigt was hochgeladen wurde

**Tag löschen und neu setzen (falls Fehler):**
```bash
# Lokal löschen
git tag -d v0.1.0
# Auf GitHub löschen
git push origin --delete v0.1.0
# Neu setzen und pushen
git tag v0.1.0
git push origin v0.1.0
```

---

## Dateistruktur

```
.github/
├── workflows/
│   └── build.yml       ← GitHub Actions Workflow
└── README.md           ← diese Datei

startos/
├── manifest/index.ts   ← Paket-Manifest (Version, Dependencies, …)
└── ...

package.json            ← npm-Manifest (Name "elektron-net-startos")
Makefile                ← lokaler Build (`make`)
```

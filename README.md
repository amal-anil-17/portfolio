# Amal Anilkumar — Portfolio

A static portfolio built with HTML, CSS, and JavaScript. No build step or package installation is required.

## Folder structure

```text
portfolio/
├── index.html               # Page content and hero initialization
├── favicon.svg              # Browser tab icon
├── css/
│   ├── styles.css           # Main styles and responsive layout
│   ├── hero-3d.css          # Hero and character presentation
│   └── nav-glass.css        # Navigation appearance
├── js/
│   ├── script.js            # General page interactions
│   ├── nav-scroll.js        # Navigation scroll behavior
│   ├── character-loop.js    # Character frame animation
│   └── icon-orbit.js        # Floating software icons
├── config/
│   └── character.json      # Character sequence settings
├── assets/
│   ├── avatar/             # Profile and social preview image
│   ├── character/          # Numbered character animation frames
│   ├── docs/               # Downloadable resume
│   ├── icons/              # Software icons
│   └── logos/              # Client logos
└── docs/
    └── REPLACE-FILES.txt    # Historical update notes
```

## Preview

Serve this folder with any static web server. If Python 3 is installed, run this from the project root:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser. A local server lets the character configuration load normally.

## Editing

- Update page content and hero initialization in `index.html`.
- Edit styles in `css/` and interactions in `js/`. Keep their load order in `index.html`.
- Adjust the animation sequence in `config/character.json`. Its frame paths are relative to `index.html`, not the configuration folder. Keep the inline fallback settings in `index.html` consistent with this file.
- Add images and downloadable files to the matching `assets/` folder. Asset locations are retained so existing image and resume links stay valid.

## Hosting

Publish the project root, including `index.html`, `favicon.svg`, `css/`, `js/`, `config/`, and `assets/`. Relative paths support hosting at either a domain root or a project subdirectory. No compilation is needed.

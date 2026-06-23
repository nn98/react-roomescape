# React Roomscape — Project Notes

See global guidelines at `~/.claude/CLAUDE.md` (loaded automatically).

## Stack
- React 18, Vite, CSS Modules (no router — page state managed in App.jsx)

## Key Conventions
- All API calls go through `src/api/index.js`; error parsing follows ProblemDetail `detail` field
- Page navigation via `page` state in `App.jsx` (SPA without react-router)
- CSS modules shared across manage pages via `ManagePage.module.css`
- `showToast(msg)` passed as prop for user feedback

## Backend
- Spring server at `http://localhost:8080` (Vite proxies via same-origin in dev)
- Reservation and Waiting share the same request shape (`name`, `date`, `timeId`, `themeId`, `amount`)

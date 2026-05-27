# Theory Trainer

אפליקציית תרגול לתיאוריה (רישיון B):

- **תיאוריה מקוצרת** — חומר להבנה (כולל "למה?" להיגיון), לפני קפיצה לשאלות
- תרגול שאלות לפי נושא
- תרגול חכם לפי חולשות
- מבחן מלא עם טיימר

## הרצה מקומית

```bash
npm install
npm run import
npm run dev
```

## סקריפטים שימושיים

- `npm run import` - מוריד ומעבד את מאגר השאלות הרשמי ל־`public/data/questions.json`
- `npm run build` - בדיקת TypeScript ובניית פרודקשן
- `npm run test` - הרצת בדיקות (Vitest)
- `npm run lint` - הרצת ESLint

## Deploy (Vercel)

1. חבר את הריפו ב-GitHub ל-Vercel
2. Framework: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

הקובץ `vercel.json` כבר מגדיר SPA rewrite לכל הנתיבים.

## CI

בכל push ל-`main` רץ GitHub Actions: `npm run test` + `npm run build`.

# Adding the Treehouse Logo to Your Dashboard

The dashboard has been updated to display your Treehouse Therapy Center logo. To add the logo:

## Steps to Add Your Logo:

1. **Save the logo image** from your conversation as `treehouse-logo.png`

2. **Place the logo file** in the `public` folder of your project:
   ```
   C:\Users\treeh\treehouse-dashboard\public\treehouse-logo.png
   ```

3. The dashboard will automatically display the logo in the header next to the company name.

## Logo Display Features:

- The logo appears at 64x64 pixels (h-16 w-16) to maintain proper proportions
- If the logo file is missing, a fallback "TT" icon will display instead
- The logo uses a teal-to-orange gradient background as a fallback
- The logo is responsive and works well on all screen sizes

## Alternative: Using a Different Logo File

If you want to use a different filename or format:

1. Update line 205 in `src/TreehouseFinancialDashboard.js`:
   ```javascript
   src="/your-logo-filename.png"
   ```

2. Supported formats: PNG, JPG, SVG

## Notes:

- The logo should ideally be square or have transparent background for best results
- Recommended size: at least 128x128 pixels for crisp display on high-resolution screens
- The logo will be contained within a 64x64 pixel area while maintaining aspect ratio 
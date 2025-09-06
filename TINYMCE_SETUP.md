# TinyMCE Setup Instructions

## Issues Fixed ✅

The TinyMCE plugin loading errors have been resolved! The email template editor
now works with a fallback system and optimized plugin configuration.

## Current Status

- ✅ **Fixed**: Plugin loading errors resolved
- ✅ **Fixed**: Removed problematic `textpattern` plugin
- ✅ **Fixed**: Removed premium plugins (`textcolor`, `colorpicker`) that
  require paid license
- ✅ **Added**: Fallback simple textarea editor when no API key is available
- ✅ **Added**: Environment configuration for TinyMCE API key
- ✅ **Optimized**: Plugin list to use only free/core plugins

## How It Works Now

1. **With API Key**: Full rich text editor with all features
2. **Without API Key**: Simple textarea editor (still functional)

## Getting a Free TinyMCE API Key (Optional)

To enable the full rich text editor features:

1. Go to
   [https://www.tiny.cloud/auth/signup/](https://www.tiny.cloud/auth/signup/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your environment variables:

```bash
# In your .env.local file (create if it doesn't exist)
NEXT_PUBLIC_TINYMCE_API_KEY=your-actual-api-key-here
```

## Plugin Limitations

**Free TinyMCE License Includes:**

- ✅ Basic text formatting (bold, italic, underline, strikethrough)
- ✅ Lists (bulleted, numbered)
- ✅ Links and images
- ✅ Tables
- ✅ Code view
- ✅ Fullscreen mode
- ✅ Media embedding
- ✅ Search and replace
- ✅ Word count
- ✅ Emoticons

**Premium Plugins (Require Paid License):**

- ❌ Text color picker
- ❌ Background color picker
- ❌ Advanced color picker
- ❌ Some advanced formatting options

The current configuration uses only free plugins to ensure compatibility.

## Environment Setup

The system now includes the TinyMCE API key configuration in `env.example`. You
can:

1. Copy `env.example` to `.env.local`
2. Add your TinyMCE API key
3. Restart your development server

## Testing

The email template creation should now work without errors. You can:

1. Go to `/admin/email-templates`
2. Click "Create Template"
3. The form should open without console errors
4. You can create templates using either the simple editor or rich text editor
   (if API key is provided)

## Features Available

### With API Key (Rich Text Editor):

- Full WYSIWYG editing
- Text formatting (bold, italic, etc.)
- Lists, links, images
- Tables and media
- Code view
- Email-specific styling

### Without API Key (Simple Editor):

- Basic textarea
- Variable insertion
- HTML editing
- All core functionality

Both modes support:

- Variable suggestions
- Email template preview
- Image uploads
- Template management

## Next Steps

The email automation system is now ready for use! You can proceed with creating
email templates and sequences as outlined in the `EMAIL_AUTOMATION_TODO.md`
file.

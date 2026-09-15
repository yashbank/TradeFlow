import os
import re

files_to_update = [
    "src/components/layout/AppShell.tsx",
    "src/app/page.tsx",
    "src/components/auth/LoginForm.tsx",
    "src/components/auth/SignUpForm.tsx",
    "src/components/auth/ForgotPasswordForm.tsx",
    "src/components/auth/ResetPasswordForm.tsx",
    "src/components/portal/PublicQuotePortal.tsx",
    "src/app/(public)/view/invoice/[token]/page.tsx",
    "src/services/pdf/InvoicePdf.tsx",
    "src/services/pdf/QuotePdf.tsx"
]

def update_file(path):
    if not os.path.exists(path):
        print(f"Not found: {path}")
        return
        
    with open(path, 'r') as f:
        content = f.read()

    # Remove Wrench import
    content = re.sub(r"import\s+\{\s*Wrench\s*(?:,\s*[a-zA-Z0-9_]+)*\s*\}\s*from\s*['\"]lucide-react['\"];?\n?", "", content)
    
    # Add TradeFlowLogo import
    if "TradeFlowLogo" not in content:
        # Find last import
        import_match = list(re.finditer(r"^import\s+.*$", content, flags=re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            end_pos = last_import.end()
            content = content[:end_pos] + "\nimport { TradeFlowLogo } from '@/components/common/TradeFlowLogo';" + content[end_pos:]
        else:
            # If 'use client' is present
            if content.startswith("'use client'"):
                content = content.replace("'use client';", "'use client';\nimport { TradeFlowLogo } from '@/components/common/TradeFlowLogo';\n")
            else:
                content = "import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';\n" + content
    
    # Replace Wrench usages with TradeFlowLogo
    # e.g. <Wrench className="h-8 w-8 text-blue-600" /> -> <TradeFlowLogo size="md" variant="icon" className="..." />
    content = re.sub(r'<Wrench[^>]*>', '<TradeFlowLogo size="md" />', content)

    # Some files might have just <Wrench />
    
    with open(path, 'w') as f:
        f.write(content)
        
for f in files_to_update:
    update_file(f)

print("Done replacing logos")

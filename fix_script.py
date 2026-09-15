import re

def fix_file(path, replace_w=False):
    with open(path, 'r') as f:
        content = f.read()
    
    # Fix SignUpForm specifically
    content = content.replace("import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';\n  Wrench,", "  Wrench,")
    content = content.replace("  Wrench,", "")
    content = content.replace("import {\n  CheckCircle2", "import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';\nimport {\n  CheckCircle2")
    content = re.sub(r'<Wrench[^>]*>', '<TradeFlowLogo size="md" />', content)

    with open(path, 'w') as f:
        f.write(content)

fix_file("src/components/auth/SignUpForm.tsx")

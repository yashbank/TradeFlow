import re

for pdf in ["src/services/pdf/InvoicePdf.tsx", "src/services/pdf/QuotePdf.tsx"]:
    with open(pdf, 'r') as f:
        content = f.read()
    
    # replace the import
    content = content.replace("import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';", "import { TradeFlowLogoPdf } from '@/components/common/TradeFlowLogoPdf';")
    
    # inject <TradeFlowLogoPdf /> above <Text style={styles.businessName}>
    content = content.replace("<Text style={styles.businessName}>", "<TradeFlowLogoPdf />\n            <Text style={styles.businessName}>")

    with open(pdf, 'w') as f:
        f.write(content)

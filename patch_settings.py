import re

with open("src/components/settings/SettingsForm.tsx", "r") as f:
    content = f.read()

# I will just insert the extra fields after the business name block.
# Let's see what follows the business name input.

content = content.replace("""              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business Name *
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>""", """              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business Name *
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business License / Tax ID
                </label>
                <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. 12-3456789" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Official Website URL
                </label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" type="url" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business Slogan / Tagline
                </label>
                <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Your tagline here" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Operating Hours
                </label>
                <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="Mon-Fri: 7:00 AM - 6:00 PM, 24/7 Emergency" />
              </div>""")

with open("src/components/settings/SettingsForm.tsx", "w") as f:
    f.write(content)


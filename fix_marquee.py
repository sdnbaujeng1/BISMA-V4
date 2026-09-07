import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

# Replace marquee tag
original = r'''<marquee className="text-blue-100 text-xs sm:text-sm italic font-medium tracking-wide">
                      ✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨
                    </marquee>'''

new_marquee = r'''<marquee className="text-blue-100 text-xs sm:text-sm italic font-medium tracking-wide" scrollAmount={schoolIdentity.sloganSpeed || "3"}>
                      {schoolIdentity.sloganText || "✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨"}
                    </marquee>'''

content = content.replace(original, new_marquee)

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)

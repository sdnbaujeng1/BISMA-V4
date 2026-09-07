import re

with open('src/hooks/useSchoolIdentity.ts', 'r') as f:
    content = f.read()

# Add to interface
content = content.replace(
    'kasihIbuLabel: string;\n}',
    'kasihIbuLabel: string;\n  sloganText?: string;\n  sloganSpeed?: string;\n}'
)

# Add to default state
content = content.replace(
    'kasihIbuLabel: "Kasih Ibu"\n  });',
    'kasihIbuLabel: "Kasih Ibu",\n    sloganText: "✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨",\n    sloganSpeed: "3"\n  });'
)

# Add to newIdentity mapping
content = content.replace(
    'kasihIbuLabel: data.kasih_ibu_label || "Kasih Ibu"\n          };',
    'kasihIbuLabel: data.kasih_ibu_label || "Kasih Ibu",\n            sloganText: data.sloganText || "✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨",\n            sloganSpeed: data.sloganSpeed || "3"\n          };'
)

# Add to mappedData mapping
content = content.replace(
    'kasihIbuLabel: data.kasih_ibu_label || data.kasihIbuLabel || "Kasih Ibu"\n          };',
    'kasihIbuLabel: data.kasih_ibu_label || data.kasihIbuLabel || "Kasih Ibu",\n            sloganText: data.sloganText || "✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨",\n            sloganSpeed: data.sloganSpeed || "3"\n          };'
)

with open('src/hooks/useSchoolIdentity.ts', 'w') as f:
    f.write(content)

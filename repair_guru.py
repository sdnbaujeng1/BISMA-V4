import re

with open('src/pages/KasihIbuGuru_clean2.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if 'style={{ width: `${(validatingProgress.current / validatingProgress.total) * 100}%` }}' in line:
        new_lines.append('              ></div>\n            </div>\n          )}\n')
    if '<span className="text-sm font-normal text-pink-500">(Rp {getStudentPoints(exchangeData.siswa) * pointPrice})</span>' in line:
        new_lines.append('                      </span>\n                    </div>\n                  )}\n')
    if 'Poin yang akan dipotong: {Math.ceil(Number(exchangeData.hargaAtk) / pointPrice)} poin (1 poin = Rp {pointPrice})' in line:
        new_lines.append('                    </p>\n                  )}\n')

code = "".join(new_lines)
# Remove the old broken ones
code = code.replace('              ></div>\n            </div>\n             \n        </div>', '        </div>')
code = code.replace('                      </span>\n                    </div>\n                </div>', '                </div>')
code = code.replace('                    </p>\n                </div>', '                </div>')

with open('src/pages/KasihIbuGuru_repaired.tsx', 'w') as f:
    f.write(code)

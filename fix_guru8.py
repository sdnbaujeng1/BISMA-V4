import re
with open('src/pages/KasihIbuGuru_clean2.tsx', 'r') as f:
    code = f.read()

# Add missing braces for analisis
code = re.sub(
    r'</div>\s*</div>\s*</div>\s*{activeTab === "peringkat" && \(',
    r'</div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "peringkat" && (',
    code
)

# Add missing braces for peringkat
code = re.sub(
    r'</div>\s*</div>\s*</div>\s*{activeTab === "validasi" && \(',
    r'</div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "validasi" && (',
    code
)

code = code.replace('              ></div>\n            </div>\n             \n        </div>', '              ></div>\n            </div>\n          )}\n        </div>')
code = code.replace('                      </span>\n                    </div>\n                </div>', '                      </span>\n                    </div>\n                  )}\n                </div>')
code = code.replace('                    </p>\n                </div>', '                    </p>\n                  )}\n                </div>')

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(code)

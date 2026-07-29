import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    code = f.read()

# Fix validasi closing
code = code.replace('        </div>            )}\n            )}\n      )}', '        </div>\n      )}</>\n      )}')
code = code.replace('        </div>\n            )}\n            )}\n      )}', '        </div>\n      )}</>\n      )}')
code = code.replace('        </div>\n      )}</>\n      )}', '        </div>\n      )}</>\n      )}')

# The exchange modal missing )
code = code.replace('                    </div>                        )}', '                    </div>\n                  )}')
code = code.replace('                    </p>                        )}', '                    </p>\n                  )}')
code = code.replace('            </motion.div>\n          </div>              )}', '            </motion.div>\n          </div>\n        )}')
code = code.replace('          </motion.div>\n              )}', '          </motion.div>\n        )}')

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(code)

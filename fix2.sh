sed -i '2735,2744c\
              <div className="flex gap-4">\
                {["Admin", "Guru", "Tendik"].map((role) => (\
                  <label key={role} className="flex items-center gap-2">\
                    <input\
                      type="checkbox"\
                      checked={roles.includes(role)}\
                      onChange={(e) => {\
                        if (e.target.checked) setRoles([...roles, role]);\
                        else setRoles(roles.filter((r) => r !== role));\
                      }}\
                    />\
                    {role}\
                  </label>\
                ))}\
              </div>' src/pages/AdminDashboard.tsx

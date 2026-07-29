sed -i '/const { type, data } = req.body;/a \
      let parsedData = data;\n\
      if (typeof data === "string") {\n\
        const lines = data.split(/\\r?\\n/).filter((l) => l.trim() !== "");\n\
        const headers = lines[0].split(";").map((h) => h.trim());\n\
        parsedData = lines.slice(1).map((line) => {\n\
          const values = line.split(";");\n\
          return headers.reduce((obj: any, header, index) => {\n\
            obj[header] = values[index]?.trim();\n\
            return obj;\n\
          }, {});\n\
        });\n\
      }' server.ts
sed -i 's/for (const item of data)/for (const item of parsedData)/g' server.ts

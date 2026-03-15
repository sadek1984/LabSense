import re

with open('src/components/view-chat.js', 'r') as f:
    content = f.read()

# Match the logic assigning systemInstruction
pattern_sys_inst = re.compile(r'(\s*let systemInstruction = "";\n\s*if \(mode === "immergo_teacher"\) \{).*?(\}\n)', re.DOTALL)

replacement_sys_inst = r'''          let systemInstruction = "";

          if (mode === "immergo_teacher") {
            systemInstruction = this._getTeacherInstruction(language, fromLanguage, missionTitle, missionDesc, targetRole);
          } else {
            systemInstruction = this._getLarsInstruction(missionTitle, missionDesc);
          }
'''

new_content = pattern_sys_inst.sub(replacement_sys_inst, content, count=1)

# Extract the big strings from the original content to make sure we insert them intact
# We will use the exact string contents from the original code!

# Actually, the python script can just extract the blocks dynamically!
teacher_block = re.search(r'systemInstruction = `(.*?)`;\n\s*\} else \{', content, re.DOTALL).group(1)
lars_block = re.search(r'\} else \{\n\s*systemInstruction = `(.*?)`;\n\s*\}', content, re.DOTALL).group(1)

new_methods = f'''
  _getTeacherInstruction(language, fromLanguage, missionTitle, missionDesc, targetRole) {{
    return `{teacher_block}`;
  }}

  _getLarsInstruction(missionTitle, missionDesc) {{
    return `{lars_block}`;
  }}
'''

# Find the location of `async getRecaptchaToken() {` and insert new_methods before it
pattern_methods = re.compile(r'(\s*async getRecaptchaToken\(\) \{)')
new_content = pattern_methods.sub(new_methods + r'\1', new_content, count=1)

with open('src/components/view-chat.js', 'w') as f:
    f.write(new_content)

print("Patch successful!")

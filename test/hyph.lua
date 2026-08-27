local PAGES = {}
local PROGS = {}
local P1 = "\000\011\000p\029VD\172\000\232L\006q`V\197;\004s/\007\227tV\241\224\000#\166\001^\253\028\166<\006\0053\000\248\2330\196Q\001\2244\000-E\146\220-\000I\003\000\227\164\002\217\160\000\0217\006v\176\011\145/\000*\211\007\175\1912\192\241"
local P2 = "ABC"
PAGES[1] = P1
PAGES[2] = P2
print('#PAGES', #PAGES)
print('len P1', #P1, 'len P2', #P2)
local parts = {}
for j = 1, #PAGES do parts[#parts + 1] = PAGES[j] end
print('parts', #parts, 'concatlen', #table.concat(parts))

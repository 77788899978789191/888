-- Test script for Gungnir obfuscator
local playerName = "JohnDoe"
local playerLevel = 42
local isActive = true

local function greet(name)
    local message = "Hello, " .. name .. "!"
    print(message)
    return message
end

local function calculateDamage(base, multiplier)
    local result = base * multiplier
    if result > 100 then
        print("Critical hit!")
        result = result * 2
    elseif result > 50 then
        print("Normal hit")
    else
        print("Weak hit")
    end
    return result
end

-- Main logic
local damage = calculateDamage(10, 8)
local greeting = greet(playerName)

for i = 1, 10 do
    local step = i * 2
    print("Step: " .. step)
end

while isActive do
    isActive = false
end

print("Done: " .. damage)

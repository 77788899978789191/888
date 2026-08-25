-- Complex test script with functions suitable for CFF
local config = {
    name = "MyGame",
    version = "1.0.0",
    debug = false
}

local function processData(input)
    local result = {}
    local count = 0
    local isValid = type(input) == "table"

    if isValid then
        for key, value in pairs(input) do
            if type(value) == "number" then
                result[key] = value * 2
                count = count + 1
            elseif type(value) == "string" then
                result[key] = value:upper()
                count = count + 1
            else
                result[key] = tostring(value)
                count = count + 1
            end
        end
    end

    return result, count
end

local function validateUser(userId, playerName)
    local isValid = false
    local reason = ""

    if userId <= 0 then
        reason = "Invalid user ID"
    elseif #playerName < 3 then
        reason = "Name too short"
    elseif #playerName > 20 then
        reason = "Name too long"
    else
        isValid = true
        reason = "OK"
    end

    return isValid, reason
end

local function main()
    local users = {
        {id = 1, name = "Alice"},
        {id = 2, name = "Bob"},
        {id = 3, name = "Charlie"}
    }

    for _, user in ipairs(users) do
        local valid, reason = validateUser(user.id, user.name)
        if valid then
            print("User valid: " .. user.name)
        else
            print("User invalid: " .. reason)
        end
    end

    local data = {x = 10, y = 20, z = "hello"}
    local processed, count = processData(data)
    print("Processed " .. count .. " items")
end

main()

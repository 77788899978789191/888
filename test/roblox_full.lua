-- Full-featured test: Roblox-specific + all control flow constructs
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local config = {
    name = "MyGame",
    version = "1.0.0",
    debug = false,
    maxPlayers = 32,
}

local function onPlayerAdded(player)
    local userId = player.UserId
    local playerName = player.Name

    if userId <= 0 then
        return "invalid"
    end

    local stats = {
        kills = 0,
        deaths = 0,
        score = 100,
    }

    for i = 1, 10 do
        stats.score = stats.score + i * 2
    end

    return playerName .. ":" .. tostring(stats.score)
end

local function processAllPlayers()
    local results = {}
    local playerList = Players:GetPlayers()

    for index, player in ipairs(playerList) do
        local result = onPlayerAdded(player)
        if result then
            results[index] = result
        end
    end

    return results
end

local total = 0
for i = 1, 100 do
    total = total + i
end

local function fibonacci(n)
    if n <= 1 then
        return n
    end
    return fibonacci(n - 1) + fibonacci(n - 2)
end

local fib10 = fibonacci(10)
print("Total: " .. total .. " Fib: " .. fib10)

if RunService:IsRunning() then
    print("Running in play mode")
else
    print("Running in edit mode")
end

return {
    total = total,
    fib = fib10,
    config = config,
}

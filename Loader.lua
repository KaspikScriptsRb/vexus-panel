--[[
    Vexus Key System Loader
    Version: 2.0.0
    Description: Connects to a custom, self-hosted key management API.
]]

-- Configuration
local API_ENDPOINT = "PASTE_YOUR_RENDER_API_URL_HERE/api/validate" -- <<< ЗАМЕНИТЕ ЭТУ СТРОКУ ВАШИМ ПОСТОЯННЫМ АДРЕСОМ
local SCRIPT_URL = "https://raw.githubusercontent.com/KaspikScriptsRb/xmsdi/refs/heads/main/.lua" -- TODO: Замените на реальный URL вашего основного скрипта

-- Dependencies
local Rayfield = loadstring(game:HttpGet('https://raw.githubusercontent.com/UI-Library/Rayfield/main/Rayfield.lua'))()
local HttpService = game:GetService("HttpService")

-- Get a unique identifier for the user
local hwid = game:GetService("RbxAnalyticsService"):GetClientId()

-- Function to validate the key against your personal API
local function validateKey(key)
    local requestBody = {
        keyValue = key,
        hwid = hwid
    }
    local success, response = pcall(function()
        return HttpService:PostAsync(API_ENDPOINT, HttpService:JSONEncode(requestBody), Enum.HttpContentType.ApplicationJson)
    end)

    if not success then
        return false, "Не удалось связаться с сервером. Попробуйте позже."
    end

    local responseBody = HttpService:JSONDecode(response)
    return responseBody.valid, responseBody.message
end

-- Main Window
local Window = Rayfield:CreateWindow({
    Name = "Vexus Loader",
    LoadingTitle = "Проверка ключа...",
    LoadingSubtitle = "by notkag",
    ConfigurationSaving = {
        Enabled = true,
        FolderName = "Vexus",
        FileName = "LoaderConfig"
    }
})

-- Create a Tab for authentication
local AuthTab = Window:CreateTab("Авторизация")

-- Create a variable to store the entered key
local enteredKey = ""

-- UI Elements
local Input = AuthTab:CreateInput({
    Name = "Ваш ключ",
    PlaceholderText = "Введите ключ...",
    NumbersOnly = false,
    CharacterLimit = 50,
    RemoveTextAfterFocusLost = false,
    Callback = function(text)
        -- Update the variable whenever the user types
        enteredKey = text
    end
})

AuthTab:CreateButton({
    Name = "Войти",
    Callback = function()
        -- Use the stored text from the variable
        local key = enteredKey
        if not key or key == "" then
            Rayfield:Notify({Title = "Ошибка", Content = "Пожалуйста, введите ключ.", Duration = 5})
            return
        end

        Rayfield:Notify({Title = "Vexus Loader", Content = "Проверка ключа...", Duration = 3})
        
        local isValid, message = validateKey(key)
        
        if isValid then
            Rayfield:Notify({Title = "Успех", Content = "Ключ принят! Загрузка скрипта...", Duration = 5})
            wait(2)
            loadstring(game:HttpGet(SCRIPT_URL))()
            Window:Destroy()
        else
            Rayfield:Notify({Title = "Ошибка", Content = message or "Произошла неизвестная ошибка.", Duration = 7})
        end
    end
})

Rayfield:Notify(
    "Vexus Loader",
    "Пожалуйста, введите ваш ключ для доступа.",
    nil, -- Icon
    7 -- Duration
)
# PeerSave API Test Script
Write-Host "🚀 Testing PeerSave API..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    Write-Host "✅ Health Check: OK" -ForegroundColor Green
    Write-Host "   Server Status: $($health.status)" -ForegroundColor Yellow
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: API Root
Write-Host "`n2. Testing API Root..." -ForegroundColor Cyan
try {
    $apiRoot = Invoke-RestMethod -Uri "http://localhost:5000/api" -Method Get
    Write-Host "✅ API Root: OK" -ForegroundColor Green
    Write-Host "   Version: $($apiRoot.version)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ API Root: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: User Registration
Write-Host "`n3. Testing User Registration..." -ForegroundColor Cyan
$testUser = @{
    username = "testuser$(Get-Random)"
    email = "test$(Get-Random)@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -ContentType "application/json" -Body $testUser
    Write-Host "✅ User Registration: OK" -ForegroundColor Green
    Write-Host "   User created: $($response.data.user.username)" -ForegroundColor Yellow
    $global:testToken = $response.data.token
    $global:testUserId = $response.data.user._id
} catch {
    Write-Host "❌ User Registration: FAILED" -ForegroundColor Red
    try {
        $errorResponse = $_ | ConvertFrom-Json
        Write-Host "   Error: $($errorResponse.message)" -ForegroundColor Red
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: User Login (if registration failed, try with existing user)
if (-not $global:testToken) {
    Write-Host "`n4. Testing User Login..." -ForegroundColor Cyan
    $loginData = @{
        identifier = "walter.white@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginData
        Write-Host "✅ User Login: OK" -ForegroundColor Green
        Write-Host "   User logged in: $($response.data.user.username)" -ForegroundColor Yellow
        $global:testToken = $response.data.token
        $global:testUserId = $response.data.user._id
    } catch {
        Write-Host "❌ User Login: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Get User Profile (if we have a token)
if ($global:testToken) {
    Write-Host "`n5. Testing Get User Profile..." -ForegroundColor Cyan
    try {
        $headers = @{ Authorization = "Bearer $global:testToken" }
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $headers
        Write-Host "✅ Get User Profile: OK" -ForegroundColor Green
        Write-Host "   Profile for: $($response.data.user.firstName) $($response.data.user.lastName)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Get User Profile: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 6: Get User Groups
    Write-Host "`n6. Testing Get User Groups..." -ForegroundColor Cyan
    try {
        $headers = @{ Authorization = "Bearer $global:testToken" }
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/groups" -Method Get -Headers $headers
        Write-Host "✅ Get User Groups: OK" -ForegroundColor Green
        Write-Host "   Total groups: $($response.data.data.Count)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Get User Groups: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 7: Get User Goals
    Write-Host "`n7. Testing Get User Goals..." -ForegroundColor Cyan
    try {
        $headers = @{ Authorization = "Bearer $global:testToken" }
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/goals" -Method Get -Headers $headers
        Write-Host "✅ Get User Goals: OK" -ForegroundColor Green
        Write-Host "   Total goals: $($response.data.data.Count)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Get User Goals: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 8: Get Dashboard Overview
    Write-Host "`n8. Testing Dashboard Overview..." -ForegroundColor Cyan
    try {
        $headers = @{ Authorization = "Bearer $global:testToken" }
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/overview" -Method Get -Headers $headers
        Write-Host "✅ Dashboard Overview: OK" -ForegroundColor Green
        Write-Host "   Total saved: $($response.data.user.totalSaved)" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Dashboard Overview: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Test Complete!" -ForegroundColor Green
Write-Host "Check the results above to see which features are working." -ForegroundColor White
param(
    [string]$ApiBase = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

function Invoke-BidoraApi {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [object]$Body,
        [string]$Token
    )
    $headers = @{}
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $parameters = @{
        Uri = "$ApiBase$Path"
        Method = $Method
        Headers = $headers
        ContentType = "application/json"
    }
    if ($null -ne $Body) { $parameters.Body = $Body | ConvertTo-Json -Depth 6 }
    Invoke-RestMethod @parameters
}

function Get-OrCreateAccount {
    param(
        [string]$Email,
        [string]$Password,
        [string]$DisplayName,
        [bool]$Seller
    )
    try {
        return Invoke-BidoraApi -Path "/api/v1/auth/login" -Method POST -Body @{ email = $Email; password = $Password }
    } catch {
        return Invoke-BidoraApi -Path "/api/v1/auth/register" -Method POST -Body @{
            email = $Email
            password = $Password
            displayName = $DisplayName
            phoneNumber = "0901234567"
            registerAsSeller = $Seller
        }
    }
}

$seller = Get-OrCreateAccount -Email "seller.demo@bidora.local" -Password "Seller123!" -DisplayName "Aurora Collector" -Seller $true
$buyer = Get-OrCreateAccount -Email "buyer.demo@bidora.local" -Password "Buyer123!" -DisplayName "Minh Anh" -Seller $false
$admin = Invoke-BidoraApi -Path "/api/v1/auth/login" -Method POST -Body @{ email = "admin@auction.local"; password = "Admin123!" }

$categories = Invoke-BidoraApi -Path "/api/v1/categories"
$products = Invoke-BidoraApi -Path "/api/v1/products/mine?size=100" -Token $seller.accessToken
$product = $products.content | Where-Object name -eq "Celestia Moonphase 1968" | Select-Object -First 1
if (-not $product) {
    $category = $categories | Where-Object name -eq "Collectibles" | Select-Object -First 1
    $product = Invoke-BidoraApi -Path "/api/v1/products" -Method POST -Token $seller.accessToken -Body @{
        categoryId = $category.id
        name = "Celestia Moonphase 1968"
        description = "Đồng hồ cơ phong cách cổ điển, mặt moonphase tinh xảo, dây da thủ công và bộ máy được bảo dưỡng hoàn chỉnh. Một vật phẩm nổi bật cho bộ sưu tập cá nhân."
        condition = "LIKE_NEW"
    }
}

$auctionPage = Invoke-BidoraApi -Path "/api/v1/auctions?size=100"
$auction = $auctionPage.content | Where-Object productId -eq $product.id | Select-Object -First 1
if (-not $auction) {
    $auction = Invoke-BidoraApi -Path "/api/v1/auctions" -Method POST -Token $seller.accessToken -Body @{
        productId = $product.id
        startingPrice = 18000000
        minimumIncrement = 500000
        startTime = (Get-Date).AddMinutes(-1).ToUniversalTime().ToString("o")
        endTime = (Get-Date).AddHours(8).ToUniversalTime().ToString("o")
    }
}

if ($auction.status -eq "PENDING_APPROVAL") {
    $auction = Invoke-BidoraApi -Path "/api/v1/admin/auctions/$($auction.id)/approve" -Method PATCH -Token $admin.accessToken
}

$bidPage = Invoke-BidoraApi -Path "/api/v1/auctions/$($auction.id)/bids?size=10"
if ($auction.status -eq "ACTIVE" -and $bidPage.totalElements -eq 0) {
    $bid = Invoke-BidoraApi -Path "/api/v1/auctions/$($auction.id)/bids" -Method POST -Token $buyer.accessToken -Body @{
        amount = [decimal]$auction.currentPrice + [decimal]$auction.minimumIncrement
        clientRequestId = [guid]::NewGuid().ToString()
    }
    $auction = Invoke-BidoraApi -Path "/api/v1/auctions/$($auction.id)"
}

[pscustomobject]@{
    AuctionId = $auction.id
    Product = $auction.productName
    Status = $auction.status
    CurrentPrice = $auction.currentPrice
    SellerLogin = "seller.demo@bidora.local / Seller123!"
    BuyerLogin = "buyer.demo@bidora.local / Buyer123!"
}

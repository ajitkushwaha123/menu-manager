import axios from "axios";

export async function SwiggyClient({
    endpoint,
    method = "GET",
    data = null,
    params = null,
    headers = {}
}) {
    try {
        const finalHeaders = {
            accept: "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            accesstoken: process.env.SWIGGY_ACCESS_TOKEN,
            origin: "https://partner.swiggy.com",
            referer: "https://partner.swiggy.com/",
            "cache-control": "no-cache",
            pragma: "no-cache",
            priority: "u=1, i",
            "sec-ch-ua": '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            ...headers,
        };

        const response = await axios({
            baseURL: process.env.NEXT_PUBLIC_SWIGGY_API,
            url: endpoint,
            method,
            data,
            params,
            headers: finalHeaders,
        });

        return {
            success: true,
            data: response.data,
            status: response.status,
        };
    } catch (error) {
        console.error(
            "SWIGGY ERROR:",
            error?.response?.status,
            error?.response?.data
        );

        return {
            success: false,
            status: error?.response?.status || 500,
            message:
                error?.response?.data?.message ||
                error?.message ||
                "Request failed",
            data: error?.response?.data,
        };
    }
}
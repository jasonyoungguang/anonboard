package com.anonboard.family.dto.response;

import lombok.Data;

@Data
public class LoginResp {
    private String token;
    private String username;

    public LoginResp(String token, String username) {
        this.token = token;
        this.username = username;
    }
}

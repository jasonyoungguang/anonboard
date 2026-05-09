package com.anonboard.family.controller.admin;

import com.anonboard.family.common.Result;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/upload")
public class UploadController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5MB

    @PostMapping("/avatar")
    public Result<Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error(400, "请选择要上传的文件");
        }
        if (file.getSize() > MAX_SIZE) {
            return Result.error(400, "文件大小不能超过 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return Result.error(400, "仅支持 JPG/PNG/GIF/WEBP 格式图片");
        }

        try {
            // 确定扩展名
            String ext = switch (contentType) {
                case "image/jpeg" -> ".jpg";
                case "image/png" -> ".png";
                case "image/gif" -> ".gif";
                case "image/webp" -> ".webp";
                default -> ".bin";
            };

            String filename = UUID.randomUUID().toString() + ext;
            Path dir = Paths.get("uploads", "avatars");
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            file.transferTo(target.toFile());

            String url = "/uploads/avatars/" + filename;
            return Result.success(Map.of("url", url));
        } catch (IOException e) {
            return Result.error(500, "文件上传失败: " + e.getMessage());
        }
    }
}

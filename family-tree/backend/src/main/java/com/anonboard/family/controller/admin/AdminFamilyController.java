package com.anonboard.family.controller.admin;

import com.anonboard.family.common.JwtUtil;
import com.anonboard.family.common.Result;
import com.anonboard.family.dto.request.AddRelativeReq;
import com.anonboard.family.dto.request.FamilyMemberReq;
import com.anonboard.family.dto.request.LoginReq;
import com.anonboard.family.dto.request.ReviewReq;
import com.anonboard.family.dto.response.LoginResp;
import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.entity.FamilyStory;
import com.anonboard.family.service.FamilyGraphValidator;
import com.anonboard.family.service.FamilyMemberService;
import com.anonboard.family.service.FamilyRelationshipService;
import com.anonboard.family.service.FamilyStoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/family")
public class AdminFamilyController {

    private final JwtUtil jwtUtil;
    private final FamilyMemberService memberService;
    private final FamilyRelationshipService relationshipService;
    private final FamilyStoryService storyService;
    private final FamilyGraphValidator graphValidator;

    @Value("${family.admin.username:admin}")
    private String adminUser;

    @Value("${family.admin.password:admin123}")
    private String adminPass;

    public AdminFamilyController(JwtUtil jwtUtil,
                                 FamilyMemberService memberService,
                                 FamilyRelationshipService relationshipService,
                                 FamilyStoryService storyService,
                                 FamilyGraphValidator graphValidator) {
        this.jwtUtil = jwtUtil;
        this.memberService = memberService;
        this.relationshipService = relationshipService;
        this.storyService = storyService;
        this.graphValidator = graphValidator;
    }

    @PostMapping("/login")
    public Result<LoginResp> login(@Valid @RequestBody LoginReq req) {
        if (!adminUser.equals(req.getUsername()) || !adminPass.equals(req.getPassword())) {
            return Result.error(401, "用户名或密码错误");
        }
        String token = jwtUtil.generateToken(req.getUsername());
        return Result.success(new LoginResp(token, req.getUsername()));
    }

    @GetMapping("/members")
    public Result<List<FamilyMember>> listMembers() {
        return Result.success(memberService.getAllMembers());
    }

    @PostMapping("/member")
    public Result<Void> addMember(@Valid @RequestBody FamilyMemberReq req) {
        FamilyMember member = new FamilyMember();
        member.setName(req.getName());
        member.setGender(req.getGender());
        member.setBirthYear(req.getBirthYear());
        member.setDeathYear(req.getDeathYear());
        member.setGeneration(req.getGeneration());
        member.setAvatarUrl(req.getAvatarUrl());
        member.setBio(req.getBio());

        if (memberService.addMember(member)) {
            return Result.success();
        }
        return Result.error(500, "添加成员失败");
    }

    @PutMapping("/member/{id}")
    public Result<Void> updateMember(@PathVariable Long id, @Valid @RequestBody FamilyMemberReq req) {
        FamilyMember member = new FamilyMember();
        member.setId(id);
        member.setName(req.getName());
        member.setGender(req.getGender());
        member.setBirthYear(req.getBirthYear());
        member.setDeathYear(req.getDeathYear());
        member.setGeneration(req.getGeneration());
        member.setAvatarUrl(req.getAvatarUrl());
        member.setBio(req.getBio());

        if (memberService.updateMember(member)) {
            return Result.success();
        }
        return Result.error(500, "更新成员失败");
    }

    @DeleteMapping("/member/{id}")
    public Result<Void> deleteMember(@PathVariable Long id) {
        if (memberService.deleteMember(id)) {
            return Result.success();
        }
        return Result.error(500, "删除成员失败");
    }

    // ---- 回收站 ----

    @GetMapping("/members/deleted")
    public Result<List<FamilyMember>> getDeletedMembers() {
        return Result.success(memberService.getDeletedMembers());
    }

    @PutMapping("/member/{id}/restore")
    public Result<Void> restoreMember(@PathVariable Long id) {
        if (memberService.restoreMember(id)) {
            return Result.success();
        }
        return Result.error(500, "恢复成员失败");
    }

    @DeleteMapping("/member/{id}/permanent")
    public Result<Void> permanentlyDeleteMember(@PathVariable Long id) {
        if (memberService.hardDeleteMember(id)) {
            return Result.success();
        }
        return Result.error(500, "永久删除成员失败");
    }

    // ---- 关系 ----

    @PostMapping("/relationship")
    public Result<Void> addRelationship(@RequestBody Map<String, Object> params) {
        Long memberAId = Long.valueOf(params.get("memberAId").toString());
        Long memberBId = Long.valueOf(params.get("memberBId").toString());
        String relationType = params.get("relationType").toString();

        // 循环检测：防止亲子关系形成祖先环
        if ("parent-child".equals(relationType)) {
            if (graphValidator.hasAncestorCycle(memberAId, memberBId)) {
                return Result.error(400, "无法添加此亲子关系：会形成循环引用");
            }
        }

        FamilyRelationship relationship = new FamilyRelationship();
        relationship.setMemberAId(memberAId);
        relationship.setMemberBId(memberBId);
        relationship.setRelationType(relationType);

        if (relationshipService.addRelationship(relationship)) {
            return Result.success();
        }
        return Result.error(500, "添加关系失败");
    }

    @DeleteMapping("/relationship/{id}")
    public Result<Void> deleteRelationship(@PathVariable Long id) {
        if (relationshipService.deleteRelationship(id)) {
            return Result.success();
        }
        return Result.error(500, "删除关系失败");
    }

    // ---- 事迹审核 ----

    @GetMapping("/stories/pending")
    public Result<List<FamilyStory>> getPendingStories() {
        return Result.success(storyService.getPendingStories());
    }

    @PutMapping("/story/{id}/review")
    public Result<Void> reviewStory(@PathVariable Long id,
                                    @Valid @RequestBody ReviewReq req) {
        // 从认证信息中获取 reviewerId（简化处理）
        if (storyService.reviewStory(id, req.getStatus(), 1L, req.getReviewComment())) {
            return Result.success();
        }
        return Result.error(500, "审核操作失败");
    }

    // ---- 添加亲属 ----

    @PostMapping("/member/{id}/relative")
    public Result<Void> addRelative(@PathVariable Long id, @Valid @RequestBody AddRelativeReq req) {
        FamilyMember existing = memberService.getById(id);
        if (existing == null) return Result.error(404, "成员不存在");

        String type = req.getRelationType();
        boolean isParent = "father".equals(type) || "mother".equals(type);
        boolean isSpouse = "wife".equals(type) || "husband".equals(type);

        int newGeneration = isParent ? existing.getGeneration() - 1
                         : isSpouse ? existing.getGeneration()
                         : existing.getGeneration() + 1;

        int gender = "father".equals(type) || "son".equals(type) || "husband".equals(type) ? 1 : 2;

        FamilyMember newMember = new FamilyMember();
        newMember.setName(req.getName());
        newMember.setGender(gender);
        newMember.setGeneration(newGeneration);
        newMember.setBirthYear(req.getBirthYear());
        newMember.setDeathYear(req.getDeathYear());

        if (isSpouse) {
            if (memberService.addSpouse(id, newMember)) {
                return Result.success();
            }
        } else if (memberService.addRelative(id, newMember, isParent)) {
            return Result.success();
        }
        return Result.error(500, "添加亲属失败");
    }
}

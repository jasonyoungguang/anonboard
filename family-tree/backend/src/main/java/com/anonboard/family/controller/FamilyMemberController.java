package com.anonboard.family.controller;

import com.anonboard.family.dto.response.FamilyTreeResp;
import com.anonboard.family.dto.response.MemberDetailResp;
import com.anonboard.family.dto.response.StatsResp;
import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.entity.FamilyStory;
import com.anonboard.family.service.FamilyMemberService;
import com.anonboard.family.service.FamilyRelationshipService;
import com.anonboard.family.service.FamilyStoryService;
import com.anonboard.family.common.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
public class FamilyMemberController {

    private final FamilyMemberService memberService;
    private final FamilyRelationshipService relationshipService;
    private final FamilyStoryService storyService;

    public FamilyMemberController(FamilyMemberService memberService,
                                  FamilyRelationshipService relationshipService,
                                  FamilyStoryService storyService) {
        this.memberService = memberService;
        this.relationshipService = relationshipService;
        this.storyService = storyService;
    }

    @GetMapping("/tree")
    public Result<FamilyTreeResp> getFamilyTree() {
        FamilyTreeResp resp = new FamilyTreeResp();
        resp.setMembers(memberService.getAllMembers());
        resp.setRelationships(relationshipService.getAllActiveRelationships());
        return Result.success(resp);
    }

    @GetMapping("/stats")
    public Result<StatsResp> getStats() {
        FamilyMemberService.StatsInfo info = memberService.getStats();
        StatsResp resp = new StatsResp();
        resp.setTotalMembers(info.totalMembers);
        resp.setMaleCount(info.maleCount);
        resp.setFemaleCount(info.femaleCount);
        resp.setUnknownGenderCount(info.unknownGenderCount);
        resp.setMinGeneration(info.minGeneration);
        resp.setMaxGeneration(info.maxGeneration);
        return Result.success(resp);
    }

    @GetMapping("/member/{id}")
    public Result<MemberDetailResp> getMemberDetail(@PathVariable Long id,
                                                     @RequestParam(required = false) String submitterName) {
        FamilyMember member = memberService.getById(id);
        if (member == null) {
            return Result.error(404, "成员不存在");
        }
        List<FamilyRelationship> relationships = relationshipService.getRelationsByMember(id);
        List<FamilyStory> stories = storyService.getVisibleStoriesByMember(id, submitterName);

        MemberDetailResp resp = new MemberDetailResp();
        resp.setMember(member);
        resp.setRelationships(relationships);
        resp.setStories(stories);
        return Result.success(resp);
    }
}

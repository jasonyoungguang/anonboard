package com.anonboard.family.controller;

import com.anonboard.family.dto.request.StorySubmitReq;
import com.anonboard.family.entity.FamilyStory;
import com.anonboard.family.service.FamilyStoryService;
import com.anonboard.family.common.Result;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
public class FamilyStoryController {

    private final FamilyStoryService storyService;

    public FamilyStoryController(FamilyStoryService storyService) {
        this.storyService = storyService;
    }

    @GetMapping("/member/{id}/stories")
    public Result<List<FamilyStory>> getMemberStories(@PathVariable Long id,
                                                       @RequestParam(required = false) String submitterName) {
        return Result.success(storyService.getVisibleStoriesByMember(id, submitterName));
    }

    @GetMapping("/stories")
    public Result<List<FamilyStory>> getAllStories() {
        return Result.success(storyService.getApprovedStories());
    }

    @PostMapping("/story/submit")
    public Result<Void> submitStory(@Valid @RequestBody StorySubmitReq req) {
        FamilyStory story = new FamilyStory();
        story.setMemberId(req.getMemberId());
        story.setTitle(req.getTitle());
        story.setContent(req.getContent());
        story.setStoryYear(req.getStoryYear());
        story.setStoryMonth(req.getStoryMonth());
        story.setCategory(req.getCategory());
        story.setSubmitterName(req.getSubmitterName());

        if (storyService.submitStory(story)) {
            return Result.success();
        }
        return Result.error(500, "提交失败");
    }
}

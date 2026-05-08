package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyStory;
import com.anonboard.family.mapper.FamilyStoryMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FamilyStoryService {

    private final FamilyStoryMapper storyMapper;

    public FamilyStoryService(FamilyStoryMapper storyMapper) {
        this.storyMapper = storyMapper;
    }

    public List<FamilyStory> getApprovedStories() {
        LambdaQueryWrapper<FamilyStory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyStory::getStatus, 1)
                .orderByAsc(FamilyStory::getStoryYear);
        return storyMapper.selectList(wrapper);
    }

    public List<FamilyStory> getStoriesByMember(Long memberId) {
        LambdaQueryWrapper<FamilyStory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyStory::getMemberId, memberId)
                .eq(FamilyStory::getStatus, 1)
                .orderByAsc(FamilyStory::getStoryYear);
        return storyMapper.selectList(wrapper);
    }

    public List<FamilyStory> getPendingStories() {
        LambdaQueryWrapper<FamilyStory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyStory::getStatus, 0)
                .orderByAsc(FamilyStory::getCreatedAt);
        return storyMapper.selectList(wrapper);
    }

    public boolean submitStory(FamilyStory story) {
        story.setStatus(0);
        return storyMapper.insert(story) > 0;
    }

    public boolean reviewStory(Long id, int status, Long reviewerId, String reviewComment) {
        FamilyStory story = storyMapper.selectById(id);
        if (story == null) return false;
        story.setStatus(status);
        story.setReviewerId(reviewerId);
        story.setReviewComment(reviewComment);
        story.setReviewedAt(java.time.LocalDateTime.now());
        return storyMapper.updateById(story) > 0;
    }
}

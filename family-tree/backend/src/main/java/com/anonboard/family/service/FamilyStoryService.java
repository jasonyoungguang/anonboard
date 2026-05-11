package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyStory;
import com.anonboard.family.mapper.FamilyStoryMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
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
        return getVisibleStoriesByMember(memberId, null);
    }

    public List<FamilyStory> getVisibleStoriesByMember(Long memberId, String submitterName) {
        LambdaQueryWrapper<FamilyStory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyStory::getMemberId, memberId);
        if (submitterName != null && !submitterName.isEmpty()) {
            wrapper.and(w -> w.eq(FamilyStory::getStatus, 1)
                    .or()
                    .eq(FamilyStory::getStatus, 0).eq(FamilyStory::getSubmitterName, submitterName));
        } else {
            wrapper.eq(FamilyStory::getStatus, 1);
        }
        wrapper.orderByAsc(FamilyStory::getStoryYear);
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

    /**
     * 创建或更新父母的生育事迹。
     * 当孩子出生年份变化时，更新对应的事迹内容。
     */
    public void createOrUpdateChildbirthStory(Long parentId, Long childId, String childName,
                                               Integer childGender, Integer birthYear, Long relationId) {
        if (birthYear == null) return;

        String genderLabel = childGender != null && childGender == 1 ? "儿子"
                           : childGender != null && childGender == 2 ? "女儿" : "孩子";
        String genderTag = childGender != null && childGender == 1 ? "（男）"
                         : childGender != null && childGender == 2 ? "（女）" : "";
        String title = "生育" + childName;
        String content = birthYear + "年生" + genderLabel + childName + genderTag;

        // 查找是否已有此关系对应的自动故事
        LambdaUpdateWrapper<FamilyStory> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(FamilyStory::getSource, "auto_childbirth")
               .eq(FamilyStory::getSourceRelationId, relationId);

        FamilyStory existing = storyMapper.selectOne(wrapper);
        if (existing != null) {
            // 更新已有故事
            existing.setTitle(title);
            existing.setContent(content);
            existing.setStoryYear(birthYear);
            storyMapper.updateById(existing);
        } else {
            // 新建故事（自动审核通过）
            FamilyStory story = new FamilyStory();
            story.setMemberId(parentId);
            story.setTitle(title);
            story.setContent(content);
            story.setStoryYear(birthYear);
            story.setCategory("生平");
            story.setStatus(1);
            story.setSubmitterName("系统");
            story.setSource("auto_childbirth");
            story.setSourceRelationId(relationId);
            storyMapper.insert(story);
        }
    }

    /**
     * 根据关系ID删除对应自动生成的故事（关系被删除时清理）。
     */
    public void deleteChildbirthStoriesByRelationId(Long relationId) {
        LambdaUpdateWrapper<FamilyStory> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(FamilyStory::getSource, "auto_childbirth")
               .eq(FamilyStory::getSourceRelationId, relationId);
        storyMapper.delete(wrapper);
    }
}
